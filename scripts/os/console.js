/* ------------
 Console.js

 Requires globals.js

 The OS Console - stdIn and stdOut by default.
 Note: This is not the Shell.  The Shell is the "command line interface" (CLI) or interpreter for this console.
 Modifications:  Major changes to output, dropped use of canvas text in favor of monospace font for more predictable
 behavior of things like clear line, clear screen, etc.
 ------------ */

function CLIconsole() {
    // Properties
    this.CurrentXPosition = 0;
    this.CurrentYPosition = 0;
    this.buffer = "";
    this.fontWidth = null;                          //Determined by init
    this.font = _FontPoint + "pt " + _FontName;     //Required by init to set up fontWidth property
    this.fontHeight = _FontPoint;                   //Is this always true?  It's worked so far with monospace fonts
    this.fontPadding = 4;                           //padding for newline
    this.textColor = "rgb(25,255,0)";               //color od text displayed in console //TODO make this configurable
    this.backgroundColor = "rgb(0,0,0)";            //color of console background //TODO make this configurable
    this._cursorBlinkInterval = 0;


    // Methods
    this.init                       = function()
    {
        //Kind of unsafe, but technically the Drawing context should never be null by the time console.init runs
        _DrawingContext.font = this.font;  //TODO - is it worth it to wrap this in a check for null or some such?
        this.fontWidth = _DrawingContext.measureText("A").width;  //Simple test, all are the same for monospace
        this.clearScreen();
//        this.putPrompt();
//        this.startCursorBlinkInterval();
    };

    this.startCursorBlinkInterval   = function()
    {
        this._cursorBlinkInterval = setInterval(this.cursorBlink, 1000);
    };

    this.clearCursorBlinkInterval   = function()
    {
        clearInterval(this._cursorBlinkInterval);
    };

    this.clearScreen                = function()
    {
        _DrawingContext.fillStyle = this.backgroundColor;
        _DrawingContext.fillRect(0,0,_Canvas.width, _Canvas.height);
        this.resetXY();
//        this.putPrompt();
    };

    this.clearLine = function()
    {  //leaves the cursor in front of the prompt
        _DrawingContext.fillStyle = this.backgroundColor;
        CurrentXPosition = 0;
        CurrentYPosition = CurrentYPosition - (this.fontHeight + this.fontPadding);
        _DrawingContext.fillRect(_CurrentX, _CurrentY, _Canvas.width, _Canvas.height);
//        this.putPrompt();

    };

    this.resetXY = function()
    {
        this.CurrentXPosition = 0;
        this.CurrentYPosition = 0;
        this.CurrentYPosition += this.fontHeight;
    };

    this.handleInput = function()
    {
        while (_KernelInputQueue.getSize() > 0)
        {
            // Get the next character from the kernel input queue.
            var chr = _KernelInputQueue.dequeue();
            // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
            if (chr == String.fromCharCode(13))  //     Enter key
            {
                // The enter key marks the end of a console command, so ...
                // ... tell the shell ...
                _OsShell.handleInput(this.buffer);
                // ... and reset our buffer.
                this.buffer = "";
            }
            // TODO: Write a case for Ctrl-C.
            else
            {
                // This is a "normal" character, so ...
                // ... draw it on the screen...
                this.putText(chr);
                // ... and add it to our buffer.
                this.buffer += chr;
            }
        }
    };

    this.putText = function(text)
    {
        //Modified to use new IO system, works with char or string just like Alan's did
        if (text !== "")
        {
            // Draw the text at the current X and Y coordinates.
            _DrawingContext.fillStyle = this.textColor;
            _DrawingContext.fillText(text, this.CurrentXPosition, this.CurrentYPosition);
            this.CurrentXPosition += _DrawingContext.measureText(text).width;
        }
    };

    this.advanceLine = function() {
        //if you're about to run off the page...
        if (this.CurrentYPosition + this.fontHeight + this.fontPadding > _Canvas.height)
        {
            //copy all but the top line of the console
            var pixels = _DrawingContext.getImageData(0, this.fontHeight + this.fontPadding, _Canvas.width, _Canvas.height - (this.fontHeight + this.fontPadding));
            this.clearScreen();
            //put the copied data back at the top, leaving room for the next row
            _DrawingContext.putImageData(pixels, 0, 0);
            this.CurrentXPosition = 0;
        }  //otherwise, just draw the new line
        else
        {
            this.CurrentXPosition = 0;
            this.CurrentYPosition = this.CurrentYPosition + this.fontHeight + this.fontPadding;
        }
    };

    this.cursorBlink = function()
    {
        var msg = "CursorBlink()";
        if (_DrawingContext === null)
        {
            msg += " FAILED";
        }
        else
        {
            console.log(_Canvas.canvas.getCurrentPosition());
//            console.log(_Canvas.CurrentYPosition);
            if (_Cursor)
            {
                //TODO - Why can't I get the current position as I expect?
//                _DrawingContext.clearRect(_DrawingContext.CurrentXPosition, _DrawingContext.CurrentXPosition, _DefaultFontSize, _DefaultFontSize);
                _DrawingContext.clearRect(0,0,10,10);
                _Cursor = !_Cursor;
            }
            else
            {
//                _DrawingContext.fillRect(_DrawingContext.CurrentXPosition, _DrawingContext.CurrentXPosition, _DefaultFontSize, _DefaultFontSize);
                _DrawingContext.fillRect(0,0,10,10);

                _Cursor = !_Cursor;
            }
            msg += " Executed";
        }
        krnTrace(msg);
    };
}
