/* --------  
   Utils.js

   Utility functions.
   -------- */

function trim(str) {     // Use a regular expression to remove leading and trailing spaces.
	return str.replace(/^\s+ | \s+$/g, "");
	/* 
	Huh?  Take a breath.  Here we go:
	- The "|" separates this into two expressions, as in A or B.
	- "^\s+" matches a sequence of one or more whitespace characters at the beginning of a string.
    - "\s+$" is the same thing, but at the end of the string.
    - "g" makes is global, so we get all the whitespace.
    - "" is nothing, which is what we replace the whitespace with.
	*/
	
}

function rot13(str) {   // An easy-to understand implementation of the famous and common Rot13 obfuscator.
                        // You can do this in three lines with a complex regular expression, but I'd have
    var retVal = "";    // trouble explaining it in the future.  There's a lot to be said for obvious code.
    for (var i in str) {
        var ch = str[i];
        var code = 0;
        if ("abcedfghijklmABCDEFGHIJKLM".indexOf(ch) >= 0) {
            code = str.charCodeAt(i) + 13;  // It's okay to use 13.  It's not a magic number, it's called rot13.
            retVal = retVal + String.fromCharCode(code);
        } else if ("nopqrstuvwxyzNOPQRSTUVWXYZ".indexOf(ch) >= 0) {
            code = str.charCodeAt(i) - 13;  // It's okay to use 13.  See above.
            retVal = retVal + String.fromCharCode(code);
        } else {
            retVal = retVal + ch;
        }
    }
    return retVal;
}

function qotd() //gets a quote of the day from the internet
                //uses a script specified by <div id="divQuote" class="hidden"> of index.html.
{
    //hope for the best, expect the worst
    var output = "Failed!";

    // {} block solely for aesthetic purposes. The IDE folds it and I get to continue believing that my code is pretty
    {
    //so dirty....  http://www.youtube.com/watch?v=HEbnc73ItCE

    //text = everything from divQuote
        var text = document.getElementById('divQuote').innerHTML.toString();

        //guard, if this fails return is "Failed!"   //TODO get the quotd guard working
//        if (text.type === "string" && text.length >= 0 )
        {
            //trim everything preceding first <br> tag
            var text = text.substring((text.indexOf('<br>') + 5));  //magic number for length of '<br>' + 1

            //this handles the quote part
            var quote = text.substring(0, (text.indexOf('<br>')));

            //author requires 2 steps, first trim out all before end of anchor open tag
            var author = text.substring(text.indexOf('">') + 2);  //magic number for length of '">'
            //then trim from start to first char in position of anchor close tag
            author = author.substring(0, author.indexOf('</a>'));
            output = quote + " - " + author;
        }
    }
    //console.log(quote + " - " + author);
    return(output);
}

function isUpper(keyCode)           //ASCII code test for A..Z
{
    return (keyCode >= 65 && keyCode <= 90);
}

function isLower(keyCode)           //ASCII code test for  || a..z
{
    return (keyCode >= 97 && keyCode <= 123);
}

function isAlpha(keyCode)           //ASCII code test for isUpper || isLower
{
    return isUpper(keyCode) && (isLower(keyCode));
}
function isNumeric(keyCode)         //ASCII code test for 0-9
{
    return (keyCode >= 48) && (keyCode <= 57);
}

function isPunctuation(keyCode)     //ASCII code test for punctuations marks
{                                   // pretty much all ascii codes > 32 && != (a-z || A-Z)
    return  (   (keyCode >= 33 && keyCode <= 47)    ||
                (keyCode >= 58 && keyCode <= 64)    ||
                (keyCode >= 91 && keyCode <= 96)    ||
                (keyCode >= 123 && keyCode <= 126)  );
}


//test code for routines I've added

//function testIsPunctuation()
//{
//    for ( var i = 0; i < 127; i++) {
//        pMarks(String.fromCharCode(i));
//    }
//}

//function testIsAplha()
//{
//    for ( var i = 0; i < 127; i++) {
//        pMarks(String.fromCharCode(i));
//    }
//}

//function testIsNumeric()
//{
//    for ( var i = 0; i < 127; i++) {
//        pMarks(String.fromCharCode(i));
//    }
//}