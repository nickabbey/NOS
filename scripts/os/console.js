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
    this.CurrentXPosition   = 0;
    this.CurrentYPosition   = 0;
    this.buffer             = "";
    this.fontWidth          = null;                             //Determined by this.init()
    this.font               = _FontPoint + "pt " + _FontName;   //Required by this.init() to set up fontWidth property
    this.fontHeight         = _FontPoint;                       //Is this always true?  It's worked so far with monospace fonts
    this.fontPadding        = 4;                                //padding for newline
    this.textColor          = "rgb(25,255,0)";                  //color od text displayed in console //TODO make this configurable
    this.backgroundColor    = "rgb(0,0,0)";                     //color of console background //TODO make this configurable
//    this.cursorBlinkInterval= 0;                                //cursor blink interval set in init //TODO make this actually work
    this.history            = [];                               //Array of commands entered
    this.historyIndex       = -1;                               //For moving through the history array

    // Methods
    this.init = function()
    {
        //Kind of unsafe, but technically the Drawing context should never be null by the time console.init runs
        _DrawingContext.font = this.font;  //TODO - is it worth it to wrap this in a check for null or some such?
        this.fontWidth = _DrawingContext.measureText("A").width;  //Simple test, all are the same for monospace
        this.clearScreen();
        this.resetXY();
//        this.startCursorBlinkInterval();  //TODO get cursor blink working
    };

//    this.startCursorBlinkInterval = function()
//    {
//        this.cursorBlinkInterval = setInterval(cursorBlink, 1000);
//    };
//
//    this.clearCursorBlinkInterval = function()
//    {
//        clearInterval(this.cursorBlinkInterval);
//    };

    this.cursorBlink = function()
    {
        krnTrace("cursor");
        if (_Cursor)
        {
            _DrawingContext.fillStyle = this.textColor;
            _DrawingContext.fillRect(this.CurrentXPosition, this.CurrentYPosition, this.fontWidth, 5);
        }
        else
        {
            _DrawingContext.fillStyle = this.backgroundColor;
            _DrawingContext.fillRect(this.CurrentXPosition, this.CurrentYPosition, this.fontWidth, 5);
        }
        _Cursor = !_Cursor;
    };

    this.clearScreen = function()
    {
        _DrawingContext.fillStyle = this.backgroundColor;
        _DrawingContext.fillRect(0,0,_Canvas.width, _Canvas.height);
    };

    this.bsod = function()
    {
        _DrawingContext.fillStyle = "rgb(25,25,255)";
        _DrawingContext.fillRect(0,0,_Canvas.width, _Canvas.height);

        //TODO Why doesn't this work?
        var imageObj = new Image();
        imageObj.onload = function() {
            _DrawingContext.drawImage(imageObj, 0, 0);
        };
        imageObj.src = '/images/glados_bsod.jpg';
    };

    this.clearLine = function()
    {  //leaves the cursor in front of the prompt
        _DrawingContext.fillStyle = this.backgroundColor;
        this.CurrentXPosition = 0;
//        this.CurrentYPosition = this.CurrentYPosition - (this.fontHeight + this.fontPadding);
        _DrawingContext.fillRect(this.CurrentXPosition, (this.CurrentYPosition - this.fontHeight), _Canvas.width, _Canvas.height);
        _OsShell.putPrompt();
    };

    this.resetXY = function()
    {
        this.CurrentXPosition = 0;
        this.CurrentYPosition = 0;
        this.CurrentYPosition += this.fontHeight + this.fontPadding;
    };

    this.handleInput = function()
    {
        while (_KernelInputQueue.getSize() > 0)
        {
            // Get the next character from the kernel input queue.
            var chr = _KernelInputQueue.dequeue();
            //Wrapper for Alan's test script, since I changed the way the console interprets scan codes
            //Unfortnately, you can't keep throwing input at it afterwards.
            if(_Testing)
            {
                if(chr != 13)  // Alan sends an interrupt for the enter key, leave it if that's on the top of the queue
                {
                    chr = chr.charCodeAt(0);  //otherwise, convert to ASCII code, since that's what handleInput() uses
                }
            }
            // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
            if (chr === 7)  //System bell
            {
                console.log(String.fromCharCode(chr));  //this would have been so much cooler if browsers actually played a sound here.
            }
            else if (chr === 13)  //     Enter key
            {
                // The enter key marks the end of a console command, so ...

                //... push the command to the history buffer,
                this.history.push(this.buffer);
                //... increment the history index (history traversal is from n...0)
                this.historyIndex += 1;
                //... handle the input
                _OsShell.handleInput(this.history[this.historyIndex]);
                //... reset the buffer
                this.buffer = '';
            }
            else if (chr == 8 || chr == 127)   // backspace or delete
            {
                this.clearLine();
                this.buffer = this.buffer.slice(0, this.buffer.length-1);
                this.putText(this.buffer);
            }
            else if (chr === 38)   // up
            {
                if (this.historyIndex == 0)
                {
                    this.buffer = this.history[this.historyIndex];
                }
                else if (this.historyIndex > 0)
                {
                    this.buffer = this.history[this.historyIndex];
                    this.historyIndex -= 1;
                    _StdIn.clearLine();
                    _StdIn.putText(this.buffer);
                }
            }
            else if (chr === 40)  //down
            {
                if (this.historyIndex == this.history.length-1)
                {
                    this.buffer = this.history[this.historyIndex];
                }
                else if (this.historyIndex < this.history.length-1)
                {
                    this.buffer = this.history[this.historyIndex];
                    this.historyIndex += 1;
                    _StdIn.clearLine();
                    _StdIn.putText(this.buffer);
                }
            }
            // TODO: Write a case for Ctrl-C.
            else
            {
                chr = String.fromCharCode(chr);
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

    this.putLine = function(text)
    {
        this.putText(text);
        this.advanceLine();
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
//            this.CurrentYPosition = this.CurrentYPosition - (this.fontHeight + this.fontPadding);
        }
        else
        {
            this.CurrentXPosition = 0;
            this.CurrentYPosition = this.CurrentYPosition + this.fontHeight + this.fontPadding;
        }
    };


}
