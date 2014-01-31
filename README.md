knockout-inplace-editor
=======================

An in-place editor binding for the KnockoutJS MVVM framework

Usage
=====

This knockout plugin adds a custom bindingHandler called 'editable'.  It works a lot like the 'text' binding, in that the DOM element and the associated observable always have the same text, but the 'editable' binding allows you to click on the text inline in the DOM to pop up a user-editable control.

There are a few other approaches to this problem out there in the 'blogosphere', but I found them each lacking in some way -- usually because they required very verbose data-binding or markup.  All the verbosity in this one should be hidden in the file you just downloaded.

So, you can do simple markup like this:

    <p>Here's a nice paragraph with some <span data-bind="editable: myObservable"></span> user editable text.<p>
    <script>
        ko.applyBindings({
            myObservable: ko.observable('awesome')
        });
    </script>

Not very verbose at all.  However, there are plenty of options to pass in to customize the behaviour, if you're into that sort of thing:

    <p>Here's an example of a drop-down editable: <span data-bind="editable: {
        value: myLimitedObservable,
        options: ['option1', 'option2', 'option3']
      }"></span>
    </p>
    <p>Here's a textarea where 'Ctrl-Enter' adds newlines and 'Enter' saves: <span data-bind="editable : {
        value: myMultilineObservable,
        rows: 6,
        cols: 20
      }"></span>
    </p>
    <p>Here's a textarea where 'Enter' adds newlines and 'Ctrl-Enter' saves: <span data-bind="editable: {
        value: myMultilineObservable,
        rows: 6,
        cols: 20,
        saveKeyPress: 'Ctrl-Enter'
      }"></span>
    </p>
    <p>'blur'ing the input always saves, unless you tell it not to: <span data-bind="editable: {
        value: myObservable,
        blurAction: 'revert',
        revertKeyPress: 115
      }"></span>.  (Oh, and 'Esc' reverts too, by default.)
    </p>


This is version 0.1.0, so there are some features yet to add, and some issues to be worked out.
