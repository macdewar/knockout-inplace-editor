knockout-inplace-editor
=======================

An in-place editor binding for the KnockoutJS MVVM framework

Usage
------

This knockout plugin adds a custom bindingHandler called 'editable'.  It's like a combination of the text and value bindings in that the DOM element shows the text stored in the observable, but it also allows you to click on the inline text to pop up an input/textarea/select to edit the value..

There are a few other approaches to this scenario out there in the 'blogosphere', but I found them each lacking in some way -- usually because they required very verbose data-binding or markup.  All the verbosity in this one should be hidden in the file you just downloaded.

For now it also requires jQuery, too.  I will probably drop that dependency by version 1.0.  It's not uncommon to be using jQuery and Knockout together already, though.

So, you can do simple markup like this ([see it work at jsfiddle](http://jsfiddle.net/C4PyR/)):

```HTML
<p>Here's a nice paragraph with some <span data-bind="editable: myObservable"></span> user editable text.<p>
<script>
    ko.applyBindings({
        myObservable: ko.observable('awesome')
    });
</script>
```

Not very verbose at all.  However, there are plenty of options to pass in to customize the behaviour, if you're into that sort of thing: ([jsfiddle](http://jsfiddle.net/hZ3s4/1/))

```HTML
<p>
  Here's an example of a drop-down editable:
  <span data-bind="editable: myLimitedObservable,
                   editableOptions: { options: ['option1', 'option2', 'option3'] }">
  </span>
</p>
<p>
  Here's a textarea where 'Ctrl-Enter' adds newlines and 'Enter' saves:
  <div data-bind="editable: myMultilineObservable,
                  editableOptions: { rows: 6, cols: 20 }">
  </div>
</p>
<p>
  Here's a textarea where 'Enter' adds newlines and 'Ctrl-Enter' saves:
  <div data-bind="editable:  myMultilineObservable,
                  editableOptions: {  rows: 6, cols: 20, saveKeyPress: 'Ctrl-Enter' }">
  </div>
</p>
<p>
  'blur'ing the input generally saves, unless you tell it not to:
   <span data-bind="editable: myObservable,
                    editableOptions: { blurAction: 'revert', revertKeyPress: 115 }">
  </span>.
  (Oh, and 'Esc' reverts by default, but we changed that to 'F4' here.)
</p>
```


This is version ~~0.1.0~~ 0.2.0, so there are some features yet to add, and some issues to be worked out.
