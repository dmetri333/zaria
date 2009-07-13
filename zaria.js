/*
    Zaria - a simple web-based rich text editor
    Copyright (C) 2008
*/
function Zaria(id, options) {
	var Public = this;
	var defaults = {
		layout: "<div class='zariaToolbar'>[bold][italic][underline]</div>[edit-area]</div>",
		buttons: [
			{name:'bold', label:'Bold', cmd:'bold', className:'bold'}, 
			{name:'italic', label:'Italic', cmd:'italic', className:'italic'}, 
			{name:'underline', label:'Underline', cmd:'underline', className:'underline'}
		]
	};

	function __construct(id, options) {
		Public.id = id;
		Public.options = (options) ? options : defaults;
		Public.prefix = "zaria-";
	}
	
	Public.build = function() {
		var textarea = document.getElementById(Public.id);
		var width = textarea.style.width;
		var height = textarea.style.height;
		var content = textarea.value;
		var className = textarea.className;

		if (document.designMode) {
			textarea.style.display = 'none';
			var id = Public.prefix + Public.id;

			var toolbar = Public.options.layout;
			for (i in Public.options.buttons) {
			
				var button = "";
				var buttonClass = (Public.options.buttons[i].className) ? Public.options.buttons[i].className : "";
				if (Public.options.buttons[i].menu) {
					button = '<select name="'+id+'" id="'+id+'-'+Public.options.buttons[i].cmd+'" class="'+buttonClass+'" title="'+Public.options.buttons[i].cmd+'"><option>Select '+Public.options.buttons[i].label+'</option>';
					for (j in Public.options.buttons[i].menu) { button += '<option value="'+Public.options.buttons[i].menu[j]['value']+'">'+Public.options.buttons[i].menu[j]['label']+'</option>'; }
					button += '</select>';
				} else {
					button = '<a name="'+id+'" id="'+id+'-'+Public.options.buttons[i].cmd+'" rel="'+Public.options.buttons[i].cmd+'" class="'+buttonClass+'" width="20" height="20" alt="'+Public.options.buttons[i].label+'" title="'+Public.options.buttons[i].label+'" href="javascript:;" ></a>';
				}
				toolbar = toolbar.replace("["+Public.options.buttons[i].name+"]", button);
			}
			var iframe = '<iframe id="'+id+'" width="'+width+'" height="'+height+'" style="width:'+width+'; height:'+height+'; border-width: thin;" class="'+className+'" frameborder="1"></iframe>';
			toolbar = toolbar.replace("[edit-area]", iframe);

			var wrapperDiv = document.createElement('div');
			wrapperDiv.innerHTML = toolbar;
			Public.insertAfter(wrapperDiv, textarea);
			Public.initButtons(id);

			var doc = Public.getIFrameDocument(id);
			// Write the textarea's content into the iframe
			doc.open();
	      	doc.write('<html><head></head><body>'+content+'</body></html>');
	  		doc.close();
 
	    	// Make the iframe editable
	    	doc.body.contentEditable = true;
	    	doc.designMode = "on";
		}
	}
	
	Public.getContents = function() {
		if (document.designMode) {
			var id = Public.prefix + Public.id;
			// Explorer reformats HTML during document.write() removing quotes on element ID names
			// so we need to address Explorer elements as window[elementID]
			if (window[id]) 
				return window[id].document.body.innerHTML;
			return document.getElementById(id).contentWindow.document.body.innerHTML;
		} else {
			// return the value from the <textarea> if document.designMode does not exist
			return document.getElementById(Public.id).value;
		}
	}

	Public.syncContent = function() {
		var content = this.getContents();
		document.getElementById(Public.id).value = content;
		return content;
	}

	Public.initButtons = function(id) {
		for (i in Public.options.buttons) {
			currentElement = document.getElementById(id+'-'+Public.options.buttons[i].cmd);
			if (currentElement && currentElement.name == id) {
				currentElement.onmouseover = (Public.options.buttons[i].buttonMouseOver) ? Public.options.buttons[i].buttonMouseOver : null;
				currentElement.onmouseout = (Public.options.buttons[i].buttonMouseOut) ? Public.options.buttons[i].buttonMouseOut : null;
				currentElement.onmousedown = (Public.options.buttons[i].buttonMouseDown) ? Public.options.buttons[i].buttonMouseDown : null;	
				currentElement.onmouseup = Public.buttonMouseUp;
				if (Public.options.buttons[i].menu)
					currentElement.onchange = Public.selectOnChange;
				else
					currentElement.onclick = Public.buttonOnClick;
			}
		}
	}

	Public.buttonMouseUp = function(e) {
		// events for mouseDown on buttons
		// e.g. this.style.xxx = xxx

		// prevent default event (i.e. don't remove focus from text area)
		var evt = e ? e : window.event;
		if (evt.returnValue) {
			evt.returnValue = false;
		} else if (evt.preventDefault) {
			evt.preventDefault();
		} else {
			return false;
		}
	}

	Public.buttonOnClick = function(e) {
		// Explorer reformats HTML during document.write() removing quotes on element ID names
		// so we need to address Explorer elements as window[elementID]
	   	var ea = (window[this.name]) ? window[this.name] : document.getElementById(this.name).contentWindow;
		ea.focus();
		ea.document.execCommand(this.rel, false, null);
		ea.focus();
	}

	Public.selectOnChange = function() {
		var cursel = this.selectedIndex;
		// First one is always a label 
		if (cursel != 0) {
			var ea = (window[this.name]) ? window[this.name] : document.getElementById(this.name).contentWindow;
			ea.focus();
			ea.document.execCommand(this.title, false, this.options[cursel].value);
			ea.focus();
			this.selectedIndex = 0;
		}
	}

	Public.getIFrameDocument = function(id) {
		// if contentDocument exists, W3C compliant (Mozilla)
		if (document.getElementById(id).contentDocument) {
			return document.getElementById(id).contentDocument;
		} else { // IE
			return document.frames[id].document;
		}
	}
	
	Public.insertAfter = function(newElement,targetElement) {
		var parent = targetElement.parentNode;
		if(parent.lastchild == targetElement) {
			parent.appendChild(newElement);
		} else {
			parent.insertBefore(newElement, targetElement.nextSibling);
		}
	}
	
	__construct.apply(this, arguments);	
}