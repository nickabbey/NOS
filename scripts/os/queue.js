/* ------------
   Queue.js
   
   A simple Queue, which is really just a dressed-up JavaScript Array.
   See the Javascript Array documentation at http://www.w3schools.com/jsref/jsref_obj_array.asp .
   Look at the push and shift methods, as they are the least obvious here.
   
   ------------ */
   
function Queue()
{
    // Properties
    this.q = [];

    // Methods
    this.getSize = function() {
        return this.q.length;    
    };

    this.isEmpty = function(){
        return (this.q.length == 0);    
    };

    this.enqueue = function(element) {
        this.q.push(element);        
    };
    
    this.dequeue = function() {
        return this.q.shift();
    };

    this.peek = function()
    {
        return this.q[0];
    };

    this.peekAhead = function()
    {
        return this.q[1];
    };
    
    this.toString = function() {
        var retVal = "";
        for (var i in this.q)
        {
            retVal += "[" + this.q[i] + "] ";
        }
        return retVal;
    };
}
