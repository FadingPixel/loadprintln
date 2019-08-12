var Print = {
    _loaded:false,
    _scrollGoneOver:false,
    _window:null,
    _doc:null,
    _logEl:null,
    _logElId:"__CustomPrintLogElement__",
    _canvasEl:null,
    _topBar:null,
    _topBarDown:false,
    _dummy:null,
    _logCounter:0,
    _tabSpaces:4,
    _debugCreateNew:!false,
    _isScrolledBottom:false,
    _scrollChecking:false,
    settings:{
        maxEntries:1000,
        prefixErrors:true,
        maxArraySize:100,
        maxObjectSize:25,
        maxFlatObjectSize:5,
        clearOnClose:false,
        lineSeparator:"line"
    },
    colors:{
        background:'black',
        error:'red',
        topBar:'darkgrey',
        textPlain:'#ccc',
        textString:'#e6db74',
        textNumber:'#AE81FF',
        textBool:'#AE81FF',
        textNull:'#AE81FF',
        textKey:"#A6E22E",
        textObjectCondensed:"#A6E22E",
        textFunction:"#66D9EF"
    },
    load:function(settings) {
        if (settings) {
            Object.assign(this.settings, settings);
        }
        this._window = (function(){return this;}).call(null);

        this._doc = this._window[["document"]];
        
        this._dummy = this._doc[["createElement"]]("p");
        
        this._canvasEl = this._doc.getElementById("output-canvas");
        
        var oldEl = this._doc.getElementById(this._logElId);
        var alreadyExists = false;
        if (oldEl && !this._debugCreateNew/*&& this.settings.keepOld*/) {
            alreadyExists = true;
        }
        
        if (alreadyExists) {
            this._logEl = oldEl;
            this._logCounter = this._logEl.childNodes.length - 1;
        } else {
            if (oldEl) {oldEl.remove();}
            
            if (this._window.eventDeleteQueue) {
                for (var i = 0; i < this._window.eventDeleteQueue.length; i++) {
                    this._window.removeEventListener(this._window.eventDeleteQueue[i][0], this._window.eventDeleteQueue[i][1]);
                }
            }
            
            this._logEl = this._doc[["createElement"]]("div");
            this._logEl.id = this._logElId;
        
            var style = "position:fixed; bottom:0; left:0; width: 100%; height:200px; background-color:"+this.colors.background+"; font-family:monospace; font-size:12px; padding:5px; box-sizing:border-box; overflow-y:scroll; white-space:pre-wrap; color:"+this.colors.textPlain+"; scroll-snap-type: y proximity;";
            this._logEl.style = style;
            
            this._topBar = this._doc[["createElement"]]('div');
            this._topBar.draggable = "true";
            this._topBar.style = "position:fixed; bottom:200px; left:0; width:100%; height:6px; background-color:"+this.colors.topBar+"; touch-action: none; user-select: none; cursor:n-resize;";
            
            var f1 = (function() {
                this._topBarDown = true;
            }).bind(this);
            var f2 = this._dragBar.bind(this);
            var f3 = (function() {
                this._topBarDown = false;
            }).bind(this);
            var f4 = function(e) {e.preventDefault();};
            
            this._window.eventDeleteQueue = [];
            
            this._topBar.addEventListener('dragstart', f1);
            this._topBar.addEventListener('dragstart', f4);
            this._topBar.addEventListener('mousedown', f1);
            this._window.addEventListener('dragend', f3);
            this._window.addEventListener('mouseup', f3);
            this._window.addEventListener('dragmove', f2);
            this._window.addEventListener('mousemove', f2);
            
            this._window.eventDeleteQueue.push(
                ['dragend', f3],
                ['mouseup', f3],
                ['dragmove', f2],
                ['mousemove', f2]);
                
            var closeBtn = this._doc[["createElement"]]('div');
            closeBtn.style = "position:absolute; top:0; right:0; height:100%; width:20px; background-color:red; cursor:pointer;";
            closeBtn.addEventListener('click', this.hide.bind(this));
            
            this._topBar.appendChild(closeBtn);
            this._logEl.appendChild(this._topBar);
            this._doc.body.appendChild(this._logEl);
        }
        
        this._loaded = true;
        this.clear();
        this.plain = this.rawSafe;
    },
    setSettings:function(settings) {
        if (settings) {
            Object.assign(this.settings, settings);
        }
    },
    _createLogEl:function() {
        if (!this._loaded) {return null;}
        this._scrollCheck();
        this._logCounter++;
        var el = this._doc[["createElement"]]("div");
        
        var style = "width:100%; margin:0 0 5px 3px;";
        el.style = style;
        
        if (this._logCounter > 1) {
            if (this.settings.lineSeparator === "space") {
                this._logEl.appendChild(this._doc[["createElement"]]("br"));
            } else if (this.settings.lineSeparator === "doublespace") {
                this._logEl.appendChild(this._doc[["createElement"]]("br"));
                this._logEl.appendChild(this._doc[["createElement"]]("br"));
            } else if (this.settings.lineSeparator === "none") {
                //Nothing!
            } else {/* === "line"*/
                var hr = this._doc[["createElement"]]("hr");
                hr.style = style + "width: auto; margin:0 4px 5px 4px;";
                this._logEl.appendChild(hr);
            }
        }
        this._logEl.appendChild(el);
        
        return el;
    },
    log:function() {
        if (!this._loaded) {
            println(Array.prototype.join.call(arguments, " "));
            return;
        }
        var data = Array.prototype.map.call(arguments, this._outputText.bind(this)).join('\n');
        this.raw(data);
    },
    link:function(name, url) {
        if (!this._loaded) {
            println(name+': '+url);
            return;
        }
        
        var el = this._createLogEl();
        el.innerHTML = '<a href="'+url+'" target="_top">'+this._safe(name)+'</a>';
        
        this.show();
        this._trim();
        this._scroll();
    },
    error:function() {
        if (!this._loaded) {
            println(Array.prototype.map.call(arguments, function(a) {return a.toString();}).join(' '));
            return;
        }
        
        var el = this._createLogEl();
        el.innerHTML = '<span style="color:'+this.colors.error+';">'+(this.settings.prefixErrors ? '✖ ERROR: ' : '')+Array.prototype.map.call(arguments, (function(a) {return this._safe(a.toString());}).bind(this)).join(' ')+'</span>';
        
        this.show();
        this._trim();
        this._scroll();
    },
    raw:function() {
        if (!this._loaded) {
            println(Array.prototype.map.call(arguments, function(a) {return a.toString();}).join(' '));
            return;
        }
        var el = this._createLogEl();
        el.innerHTML = Array.prototype.map.call(arguments, function(a) {return a.toString();}).join(' ');
        
        this.show();
        this._trim();
        this._scroll();
    },
    rawSafe:function() {
        if (!this._loaded) {
            println(Array.prototype.map.call(arguments, function(a) {return a.toString();}).join(' '));
            return;
        }
        var el = this._createLogEl();
        el.innerHTML = Array.prototype.map.call(arguments, (function(a) {return this._safe(a.toString());}).bind(this)).join(' ');
        
        this.show();
        this._trim();
        this._scroll();
    },
    hide:function() {
        if (!this._loaded) {return;}
        this._logEl.style.display = 'none';
        if (this.settings.clearOnClose) {this.clear();}
    },
    show:function() {
        if (!this._loaded) {return;}
        this._logEl.style.display = 'block';
    },
    clear:function() {
        if (!this._loaded) {return;}
        this._trim(0);
    },
    _color:function(data, color) {
        return '<span style="color:'+this.colors[color]+';">'+data+'</span>';
    },
    _safe:function(data) {
        if (!this._loaded) {return 'UNSAFE';}
        this._dummy.innerText = data;
        return this._dummy.innerHTML;
    },
    _bool:function(data) {
        return data ? "true" : "false";//Works with 'falsy' values
    },
    _number:function(data) {
        return data.toString();
    },
    _text:function(data) {
        return "\""+data.toString()+"\"";
    },
    _array:function(data) {
        if (!this._loaded) {return '[Array(Unprocessed)]';}
        var out = "";
        if (data.length > this.settings.maxArraySize) {return this._color("[Array(Long)]", "textObjectCondensed");}
        for (var i = 0; i < data.length; i++) {
            var curr = data[i], last = "";
            switch (typeof curr) {
                case "function":
                    last = this._color("function", "textFunction")+"()";
                    break;
                case "number":
                    last = this._color(this._safe(this._number(curr)), "textNumber");
                    break;
                case "boolean":
                    last = this._color(this._safe(this._bool(curr)), "textBool");
                    break;
                case "string":
                    last = this._color(this._safe(this._text(curr)), "textString");
                    break;
                case "object":
                    if (Array.isArray(curr)) {
                        last = this._array(curr);
                    } else {
                        // last = this._tab(this._object(curr), true);
                        last = curr === null ? 
                                this._color("null", "textNull") : 
                                /*this._color("{Object}", "textObjectCondensed")*/this._object(curr, true);
                    }
                    break;
            }
            out += (i > 0 ? ", " : "") + last;
        }
        return "["+out+"]";
    },
    _object:function(data, flat) {
        if (!this._loaded) {return '{Object(Unprocessed)}';}
        var entries = Object.entries(data);
        if (flat && entries.length > this.settings.maxFlatObjectSize) {return this._color('{Object}', "textObjectCondensed");}
        if (entries.length > this.settings.maxObjectSize) {return this._color("{Object(Large)}", "textObjectCondensed");}
        if (entries.length === 0) {return this._color("{Object(No Enumerables)}", "textObjectCondensed");}
        var out = "";
        for (var i = 0; i < entries.length; i++) {
            var last = "", entry = entries[i][1];
            switch (typeof entry) {
                case "function":
                    last = this._color("function", "textFunction")+"()";
                    break;
                case "number":
                    last = this._color(this._safe(this._number(entry)), "textNumber");
                    break;
                case "boolean":
                    last = this._color(this._safe(this._bool(entry)), "textBool");
                    break;
                case "string":
                    last = this._color(this._safe(this._text(entry)), "textString");
                    break;
                case "object":
                    if (Array.isArray(entry)) {
                        last = this._array(entry);
                    } else if (entry === null) {
                        last = this._color("null", "textNull");
                    } else{
                        // last = this._tab(this._object(entry), true);
                        last = this._object(entry, true);
                    }
                    break;
            }
            out += (i > 0 ? "," : "") + (flat ? (i > 0 ? " " : "") : "\n") + this._color(this._safe(this._text(entries[i][0])), "textKey") +": "+last;
        }
        return "{"+(flat ? out : this._tab(out)+"\n")+"}";
    },
    _tab:function(text, excludeFirst, spaces) {
        spaces = spaces || this._tabSpaces;
        spaces = " ".repeat(spaces);
        if (excludeFirst) {
            var t = text.split('\n');
            return t[0] + '\n' + t.slice(1).map(function(t) {return spaces + t;}).join('\n');
        } else {
            return text.split('\n').map(function(t) {return spaces + t;}).join('\n');
        }
    },
    _outputText:function(arg) {
        if (!this._loaded) {return 'UNPROCESSED';}
        switch (typeof arg) {
            case "object":
                if (arg === null) {
                    return this._color("null", "textNull");
                } else if (Array.isArray(arg)) {
                    return this._array(arg);
                } else {
                    return this._object(arg);
                }
                break;
            case "number":
                return this._color(this._safe(this._number(arg)), "textNumber");
            case "bool":
                return this._color(this._safe(this._bool(arg)), "textBool");
            case "string":
                return this._color(this._safe(this._text(arg)), "textString");
            case "function":
                return this._color("function", "textFunction")+"()";
        }
    },
    _scrollCheck:function() {
        this._isScrolledBottom = this._logEl.scrollHeight - this._logEl.clientHeight <= this._logEl.scrollTop + 1;
        this._scrollChecking = true;
    },
    _scroll:function() {
        if (!this._loaded) {return;}
        if (!this._scrollGoneOver && this._logEl.scrollHeight > this._logEl.clientHeight) {
            this._scrollGoneOver = true;
            this._logEl.scrollTop = this._logEl.scrollHeight;
        } else if (this._scrollGoneOver && this._logEl.scrollheight === this._logEl.clientHeight) {
            this._scrollGoneOver = false;
        }
        if ((this._scrollChecking && this._isScrolledBottom) || this._logEl.scrollHeight - this._logEl.clientHeight <= this._logEl.scrollTop + 1) {
            this._logEl.scrollTop = this._logEl.scrollHeight;
        }
        this._scrollChecking = false;
    },
    _dragBar:function(e) {
        if (!this._loaded) {return;}
        if (!this._topBarDown) {return;}
        var height = this._canvasEl.getBoundingClientRect().bottom - e.clientY;
        height = this._window.Math.max(this._window.Math.min(height, this._canvasEl.height - 6), 15);
        this._topBar.style.bottom = height+'px';
        this._logEl.style.height = height+'px';
        this._scroll();
    },
    _trim:function(num) {
        if (!this._loaded) {return;}
        //First element is the 'top-bar'
        while (this._logEl.childNodes.length-1 > (num===undefined?this.settings.maxEntries:num)) {
            this._logEl.childNodes[1].remove();
            this._logCounter--;
        }
    }
};
Print.load();
Print.hide();
Print.setSettings({lineSeparator: "line"});
const PRINTS_INTERVAL = 0;
const DEFINE_PRINTS = function() {
    if (window.Processing.instances[0]) {
        clearInterval(PRINTS_INTERVAL);
        window.Processing.instances[0].Print = Print;
    }
};
PRINTS_INTERVAL = setInterval(DEFINE_PRINTS, 100);

