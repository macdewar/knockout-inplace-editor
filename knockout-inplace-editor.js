/*
  Knockout.InPlaceEditor
  An extension to the Knockout.js library that adds in-place editor controls.

  Include this file in your markup after knockout-3.0.0.js and you can write markup
  like this:

  <style type="text/css">
    .editable { display: inline-block; }
  </style>
  <p>
    Some static data on your page with
    <div data-bind="editable: textField"></div>
    some inline, in-place user-editable text.
  </p>
  <script>
    ko.applyBindings( { textField: ko.observable('BOOM!') } );
  </script>
*/

function InPlaceEditingError(message){
  this.message = message;
}
InPlaceEditingError.prototype = new Error();

/*
  An extender to allow setting options on the observable.
  Any options also set on the binding will override those set here.

  e.g.
  <div id="t1" data-bind="editable: textField"></div>
  <div id="t2" data-bind="editable: textField, editableOptions: { defaultText: 'click me' }"></div>
  <script>
    ko.applyBindings({
      textField : ko.observable().extend({
        editableOptions: { defaultText: 'empty' }
      })
    });
  </script>

  When textField is empty, #t1 will contain "empty" and #t2 will contain "click me".
*/
ko.extenders.editableOptions = function(target, options){
  if (options && $.isPlainObject(options)){
    target.editableOptions = options;
  }
  return target;
};

ko.bindingHandlers.editable = (function(){
  var defaults = {
    titleText     : 'Click to edit', //element gets this titleText if it doesn't already have a title attr.
    defaultText   : '&nbsp;',        //text shown when value of the observable is empty (null or '')
    startEvent    : 'click focus',   //what triggers the editable control to show up
    saveKeyPress  : 'Enter',         //keypress to save.  'Ctrl-Enter' is a good option if newlines are allowed in the input.  null is also a good value, if there's a saveControl or if blurAction is 'save'.
    saveControl   : null,            //'button' or 'link' or null.  inserted after input control
    saveText      : 'OK',            //text of saveControl
    revertKeyPress: 'Esc',           //keypress to revert
    revertControl : null,            //'button' or 'link' or null, inserted after input control
    revertText    : 'Cancel',        //text of revertControl
    blurAction    : 'save',          //either 'save' or 'revert' on blur (Revert means an explicit action is required to save)
    editableClass : 'editable',      //element gets this classname
    editingClass  : 'editing',       //element gets this classname during editing
    emptyClass    : 'empty',         //element gets this classname when (and displays opts.defaultText) when empty.
    savingClass   : 'saving',        //element gets this classname while saveHandler is running (maybe server-side validation with AJAX or some other long-running process)
    invalidClass  : 'nope',          //element gets this classname when it has input that won't be saved
    rows          : null,            //null or NaN or 0 or 1 makes an <input>, more than 1 makes <textarea>
    cols          : null,            //used as 'size' for <input> or 'cols' for <textarea>
    saveHandler   : null,            //if defined, processes input before save (perhaps validation, perhaps formatting, ... ).  Should return the value to be saved. If the return value === false, the element reverts to its content before editing began.  Asynchronous code won't work here -- it must return the processed value.
    inputType     : 'text',          //--experimental--
    options       : null,            //--experimental-- if defined, only values from this array are valid input (makes a <select>)
    optionsText   : null,            //--experimental--
    optionsValue  : null,            //--experimental--
    optionsCaption: null             //--experimental--
  },
  init = function(element, valueAccessor, allBindings, deprecated, bindingContext){
    var $el        = $(element).empty(),
        observable = valueAccessor(),
        opts       = $.extend({}, defaults, observable.editableOptions, allBindings.get('editableOptions')),
        $label     = $('<span>'),
        $inputDiv  = $('<div>').css({ display: 'inline-block', 'vertical-align': 'bottom' }),
        $ctrlDiv   = $('<div>').css({ display: 'inline-block', 'vertical-align': 'baseline' }),
        $input, $saveControl, $revertControl,
        tabindex = $el.attr('tabindex'),
        start, stop, save, revert;

    if (undefined == observable || !ko.isWriteableObservable(observable)){
      throw new InPlaceEditingError("Must provide an observable for the editable to save to");
    }

    if (opts.titleText && !$el.attr('title')){
      $el.attr('title', opts.titleText);
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
    if (tabindex){
      $input.attr('tabindex', tabindex);
    }
    $inputDiv.append($input);

    //define event handlers
    start = function(){
      $el.addClass(opts.editingClass);
      $label.hide();
      $inputDiv.show();
      $input.val(observable()).prop('disabled', false).focus();
    };
    stop = function(evt){
      $inputDiv.hide();
      $input.prop('disabled', true);
      $label.show();
      $el.removeClass(opts.editingClass);
      evt.stopPropagation();
    };
    save = function(){
      var processed;
      if ($.isFunction(opts.saveHandler)){
        $el.addClass('savingClass');
        processed = opts.saveHandler($input.val());
        if (processed !== false){
          $input.val(processed);
        }
        $el.removeClass('savingClass');
      }
      observable($input.val());
    };
    revert = function(){
      //don't really need this anymore.
      $input.val(observable());
    };

    if (opts.saveControl && $.type(opts.saveControl) == 'string'){

      if (opts.saveControl.toLowerCase() == 'link'){
        $saveControl = $('<a>').attr('href', '#');
      }else{
        $saveControl = $('<button>');
      }

      $saveControl.html(opts.saveText).on('click', function(evt){
        evt.preventDefault();
        save();
        stop(evt);
      });

      $inputDiv.append($saveControl);
    }

    if (opts.revertControl && $.type(opts.revertControl) == 'string'){

      if (opts.revertControl.toLowerCase() == 'button'){
        $revertControl = $('<button>');
      }else{
        $revertControl = $('<a>').attr('href', '#');
      }

      $revertControl.html(opts.revertText).on('click', function(evt){
        evt.preventDefault();
        revert();
        stop(evt);
      });

      $inputDiv.append($revertControl);
    }


    //bind event handlers
    $el.on(opts.startEvent, start);

    //don't "do" this; just expose a start event that
    //a startControl can trigger.
    //if (opts.startControl){
    //  $(opts.startControl).on(opts.startEvent, start);
    //}

    $input.on('blur', function(evt){
      if (opts.saveControl == null){
       ( opts.blurAction == 'save' ? save : revert )();
       stop(evt);
      }

    }).on('keydown', function(evt){

      if (evt.which == opts.revertKeyPress || evt.which == 27 && opts.revertKeyPress == 'Esc'){
        evt.preventDefault();
        revert();
        stop(evt);
      }
      if (evt.which == opts.saveKeyPress){
        evt.preventDefault();
        save();
        stop(evt);
      }
      if (opts.saveKeyPress.match(/Enter/) && evt.which == 13){
        if (opts.saveKeyPress == 'Enter' && !(evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey)){
          evt.preventDefault();
          save();
          stop(evt);
        }
        if (opts.saveKeyPress == 'Ctrl-Enter' && (evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey)){
          evt.preventDefault();
          save();
          stop(evt);
        }
      }
    })

    //hide the SELECT when an option is chosen.
    if ($input.prop('nodeName') == 'SELECT' && opts.saveControl == null){
      $input.on('change', function(){ $input.blur() });
    }

    //add it all to the DOM:
    $el.addClass(
      opts.editableClass
    ).append($label, $inputDiv.hide());


    //Allow Knockout to remove this node without mem-leaking all the stuff we created here.
    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        $el.empty();
    });

    //just to prevent any descendant bindings.  I can't imagine
    //a scenario in which you'd have descendant nodes in an
    //editable anyway.
    return { controlsDescendantBindings: true };
  },
  update = function(element, valueAccessor, allBindings, deprecated, bindingContext){
    var $el        = $(element),
        $label     = $el.children('span').first(),
        $input     = $el.find('input,select,textarea').first(),
        observable = valueAccessor(),
        opts       = $.extend({}, defaults, observable.editableOptions, allBindings.get('editableOptions')),
        idx;

    $input.val(observable());

    if ($input.prop('nodeName') == 'SELECT'){
      idx = $input.prop('selectedIndex');
      if (opts.optionsCaption && idx > 0){
        idx--;
      }
      selectedObj = opts.options[idx];

      if (selectedObj && $.type(opts.optionsText) == 'function'){
        label = opts.optionsText(selectedObj);
      }else if (selectedObj && $.type(opts.optionsText) == 'string'){
        label = selectedObj[opts.optionsText];
      }else{
        label = observable();
      }
    }else{
      label = observable();
    }

    if (label){
      $el.removeClass(opts.emptyClass);
      $label.html(label);
    }else{
      $el.addClass(opts.emptyClass);
      $label.html(opts.defaultText);
    }
  };

  return {
    defaults: defaults,
    init: init,
    update: update
  };
})();
