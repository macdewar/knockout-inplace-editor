/*
  Knockout.InPlaceEditor
  An extension to the Knockout.js library that adds in-place editor controls.

  Include this file in your markup after knockout-3.0.0.js and you can write markup
  like this:

  <p>
    Some static data on your page with

    <span data-bind="editable: myTextField"></span>

    some inline, in-place user-editable text.
  </p>

  <script>

    var vm = {
      myTextField: ko.observable('BOOM!');
    }
    ko.applyBindings(vm);

  </script>
*/

function InPlaceEditingError(message){
  this.message = message;
}
InPlaceEditingError.prototype = new Error();

ko.bindingHandlers.editable = (function(){
  var defaults = {
    hoverText     : 'Click to edit',
    defaultText   : '&nbsp;',
    startEvent    : 'click',    //what triggers the editable control to show up
    startControl  : null,       //clicking somewhere else to focus the editable bit (if it starts out with no text, no area to click on, for instance)
    saveKeyPress  : 'Enter',    //keypress to save.  'Ctrl-Enter' is a good option if newlines are allowed in the input.  null is also a good value, if there's a saveControl or if blurAction is 'save'.
    saveControl   : null,       //'button' or 'link' or null.  inserted after input control
    saveText      : 'OK',       //text of saveControl
    revertKeyPress: 'Esc',      //keypress to revert
    revertControl : null,       //'button' or 'link' or null, inserted after input control
    revertText    : 'Cancel',   //text of revertControl
    blurAction    : 'save',     //either 'save' or 'revert' on blur (Revert means an explicit action is required to save)
    editableClass : 'editable', //element gets this classname
    editingClass  : 'editing',  //element gets this classname during editing
    savingClass   : 'saving',   //element gets this classname while saveHandler is running (maybe server-side validation with AJAX or some other long-running process)
    invalidClass  : 'nope',     //element gets this classname when it has input that won't be saved
    inputType     : 'text',
    rows          : null,       //null or NaN or 0 or 1 makes an <input>, more than 1 makes <textarea>
    cols          : null,       //used as 'size' for <input> or 'cols' for <textarea>
    options       : null,       //if defined, only values from this array are valid input (makes a <select>)
    optionsText   : null,
    optionsValue  : null,
    optionsCaption: null,
    saveHandler   : null        //if defined, processes input before save (perhaps validation, perhaps formatting, ... ).  Should return the value to be saved. If the return value === false, the element reverts to its content before editing began.
  },
  init = function(element, valueAccessor, allBindings, deprecated, bindingContext){
    var $el = $(element),
        val = valueAccessor(),
        $label = $('<span>'), $input, $saveControl, $revertControl,
        observable, opts,
        start, stop, save, revert;

    //get the ko.observable we're dealing with
    if (ko.isWriteableObservable(val)){
       opts = defaults;
       observable = val;
    }
    else{
      opts = $.extend({}, defaults, val);
      observable = val.value || allBindings.get('value');
    }
    if (undefined == observable || !ko.isWriteableObservable(observable)){
      throw new InPlaceEditingError("Must provide an observable for the editable binding to save input to");
    }

    //create input node (<select> or <textarea> or <input>)
    if (opts.options){
      $input = $('<select>');
      ko.applyBindingsToNode($input.get(0), {
        options: opts.options,
        optionsText: opts.optionsText,
        optionsValue: opts.optionsValue,
        optionsCaption: opts.optionsCaption
      });
    }else if (opts.rows && $.isNumeric(opts.rows) && opts.rows > 1){
      $input = $('<textarea>').attr({
        rows: opts.rows,
        cols: opts.cols
      });
      $label.css('white-space', 'pre');
    }else{
      $input = $('<input>').attr({
        type: opts.inputType,
        size: opts.cols
      });
    }
    $input.hide();
    $label.html(observable() || opts.defaultText);

    //define event handlers
    start = function(){
      $el.addClass(opts.editingClass);
      $label.hide();
      $input.val(observable()).show().focus();
    };
    stop = function(){
      $el.removeClass(opts.editingClass);
      $input.hide();
      $label.html(observable() || opts.defaultText).show().blur();
      $el.blur();
    };
    save = function(){
      if (opts.saveHandler){
        $el.addClass('savingClass');
        $input.val(opts.saveHandler($input.val()));
        $el.removeClass('savingClass');
      }
      observable($input.val());
    };
    revert = function(){
      $input.val(observable());
    };

    //build dom elements
    $el.addClass(
      opts.editableClass
    ).append($label, $input);

    if (opts.hoverText && !$el.attr('title')){
      $el.attr('title', opts.hoverText);
    }

    if (opts.saveControl && $.type(opts.saveControl) == 'string'){
      if (opts.saveControl.toLowerCase() == 'link'){
        $saveControl = $('<a>').attr('href', '#');
      }else{
        $saveControl = $('<button>');
      }
      $saveControl.html(opts.saveText).on('click', function(){
        evt.preventDefault();
        save();
        stop();
      });
      $el.append($saveControl);
    }
    if (opts.revertControl && $.type(opts.revertControl) == 'string'){
      if (opts.revertControl.toLowerCase() == 'button'){
        $revertControl = $('<button>');
      }else{
        $revertControl = $('<a>').attr('href', '#');
      }
      $revertControl.html(opts.revertText).on('click', function(){
        evt.preventDefault();
        revert();
        stop();
      });
      $el.append($revertControl);
    }


    //bind event handlers

    $el.on(opts.startEvent, start);
    if (opts.startControl){
      $(opts.startControl).on(opts.startEvent, start);
    }

    $input.on('blur', function(){

      (opts.blurAction == 'save' ? save : revert)();
      stop();

    }).on('keydown', function(evt){

      if (evt.which == opts.revertKeyPress || evt.which == 27 && opts.revertKeyPress == 'Esc'){
        evt.preventDefault();
        revert();
        stop();
      }
      if (evt.which == opts.saveKeyPress){
        evt.preventDefault();
        save();
        stop();
      }
      if (opts.saveKeyPress.match(/Enter/) && evt.which == 13){
        if (opts.saveKeyPress == 'Enter' && !(evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey)){
          evt.preventDefault();
          save();
          stop();
        }
        if (opts.saveKeyPress == 'Ctrl-Enter' && (evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey)){
          evt.preventDefault();
          save();
          stop();
        }
      }
    })

    if ($input.prop('nodeName') == 'SELECT'){
      $input.on('change', function(){ $input.blur() });
    }

    //just to prevent any descendant bindings.  I can't imagine
    //a scenario in which you'd have descendant nodes in an
    //editable anyway.
    return { controlsDescendantBindings: true };
  },
  update = function(element, valueAccessor, allBindings, deprecated, bindingContext){
    var opts, val = valueAccessor();

    if (ko.isWriteableObservable(val)){
       opts = defaults;
       observable = val;
    }
    else{
      opts = $.extend({}, defaults, val);
      observable = val.value || allBindings.get('value');
    }
    if (undefined == observable || !ko.isWriteableObservable(observable)){
      throw new InPlaceEditingError("Must provide an observable for the editable binding to save input to");
    }
    $(element).children('span').html(observable() || opts.defaultText);
  };

  return {
    init: init,
    update: update
  }
})();
