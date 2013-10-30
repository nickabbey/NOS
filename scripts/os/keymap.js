/* ----------------------------------
 keyboardmap.js

    Required by devicDriverKeyboard

    Provides the keyboard mappings for scancodes to ascii codes.
    Since our scancodes are javascript keypresses these may be different based on things like hardware (keyboard)
    or Sotware (host OS, browser, etc...)

    There's got to be a better way. This prototype is kind of bloated, but I needed to figure it all out to make it work
 ---------------------------------- */

function Keymap() {
    //Fields
    function KeyPair(a,s) {
        //Fields
        this.asciiCode = a;
        this.shiftedAsciiCode = s;
    }
    //Properties
    this.scanCodes  = [];   // make it 128 characters long, index = ascii code, value = scan code
    this.shiftedCodes = []; //contains codes that only get returned when shift key is down

    //Methods
    this.init = function() {
        for (var i=0; i < 128; i++)
        {  //initialize the stuff we know about and is easy (scancode=ascii and in a contiguous segment)
            if ((i >= 0 && i <= 32)     ||  //everything up to and including space
                (i >= 37 && i <= 40)    ||  // arrows
                (i >= 48 && i <= 57)    ||  // digits
                (i >= 65 && i <=90)     ||  // A..Z
                (i >= 97 && i <= 123)    )  // a..z
            {
                this.scanCodes[i] = i;
            }
            else
            {
                this.scanCodes[i] = 7; //ASCII bell code, anything left uninitialized (should) make noise
            }
        }

        // Add the rest by hand...  blech!
        // Duplicates here are bad.  Ask Egon, he'll explain it.
        this.scanCodes[39] = 222; // '
        this.scanCodes[44] = 188; // ,
        this.scanCodes[45] = 189; // -
        this.scanCodes[46] = 190; // .
        this.scanCodes[47] = 191; // /
        this.scanCodes[59] = 186; // ;
        this.scanCodes[61] = 187; // =
        this.scanCodes[91] = 219; // [
        this.scanCodes[92] = 220; // \
        this.scanCodes[93] = 221; // ]
        this.scanCodes[96] = 192; // `
        this.scanCodes[127] = 46;  //delete

        // These are the ones that generated using the shift key
        this.shiftedCodes.push(new KeyPair(49, 33));
        this.shiftedCodes.push(new KeyPair(39, 34));
        this.shiftedCodes.push(new KeyPair(51, 35));
        this.shiftedCodes.push(new KeyPair(52, 36));
        this.shiftedCodes.push(new KeyPair(53, 37));
        this.shiftedCodes.push(new KeyPair(55, 38));
        //Hopefully if you're looking this closely, you see that I figured out how to do this and it's working
        //(for the ones I did above anyway)
        //there was just too much other stuff to get right before slogging through this tedium so I moved on
//        this.scanCodes[40] = "!"; // ( 57
//        this.scanCodes[41] = "!"; // ) 48
//        this.scanCodes[42] = "!"; // * 56
//        this.scanCodes[43] = "!"; // + 61
//        this.scanCodes[58] = "!"; // : 59
//        this.scanCodes[60] = "!"; // < 44
//        this.scanCodes[62] = "!"; // > 46
//        this.scanCodes[63] = "!"; // ? 47
//        this.scanCodes[64] = "!"; // @ 50
//        this.scanCodes[94] = "!"; // ^  64
//        this.scanCodes[95] = "!"; // _  45
//        this.scanCodes[123] = "!"; // {  91
//        this.scanCodes[124] = "!"; // |  92
//        this.scanCodes[125] = "!"; // }  93
//        this.scanCodes[126] = "!"; // ~  96

    };

    //returns the scancode of the given ascii value
    this.fromAsciiCode = function(code)
    {
        return this.scanCodes[code];
    };

    //returns ascii 7 if the scancode is unknown, otherwise returns the ascii value of the given scancode
    this.fromScanCode = function(code)
    {
        var retVal = 7;
        if (this.scanCodes.indexOf(code))
        {
            retVal = this.scanCodes.indexOf(code);
        }
        return retVal;
    };

    //returns the correct ascii code when the scancode is shifted
    this.fromShiftedScanCode = function(code)
    {
        var retVal = 7;
        for (var i = 0; i < this.shiftedCodes.length -1; i++)
        {
            if (this.shiftedCodes[i].asciiCode === code)
            {
                retVal = this.shiftedCodes[i].shiftedAsciiCode;
            }
        }
        return retVal;
    };

    //returns true for the ascii codes generated using shift + unknown scancode.
    //there's probably a better method name, I just really wanted a method named "this.isShifty"
    this.isShifty = function(scanCode) {
        var retVal = false;
        if((scanCode >= 44 && scanCode <= 57)  ||   //digits punctuation and math symbols
           (scanCode >= 91 && scanCode <= 93)  ||   // [ \ ]
           (scanCode ===39 || scanCode === 96)  )   // ' and `
        {
            retVal = true;
        }
        return retVal;
    };

    //pretty obvious
    this.isAlpha = function(scanCode) {
        var retVal = false;
        if( ((scanCode >= 65) && (scanCode <= 90)) ||   // A..Z
            ((scanCode >= 97) && (scanCode <= 123)) )   // a..z
        {
            retVal = true;
        }
        return retVal;
    };

    //ditto
    this.isNumeric = function(scanCode) {
        var retVal = false;
        if(scanCode >= 48 && scanCode <= 57)   // 0..9
        {
            retVal = true;
        }
        return retVal;
    };

    //samesies
    this.isOther = function(scanCode) {
        var retVal = false;
        if((scanCode >= 219 && scanCode <= 222)  ||  //brackets
            (scanCode >= 186 && scanCode <= 192)  )  //punctuations
        {
            retVal = true;
        }
        return retVal;
    };
}