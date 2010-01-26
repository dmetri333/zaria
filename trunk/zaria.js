/*
    Zaria - a simple web-based rich text editor
    Copyright (C) 2008
*/
function Zaria(id, options) {
	var Public = this;
	var defaults = {
		layout: "<div class='zariaToolbar'>[bold][italic][underline]</div>[edit-area]",
		buttons: [
			{name:'bold', label:'Bold', cmd:'bold', className:'bold'}, 
			{name:'italic', label:'Italic', cmd:'italic', className:'italic'}, 
			{name:'underline', label:'Underline', cmd:'underline', className:'underline'}
		]
	};

	function __construct(id, options) {
		Public.id = id;
		Public.prefix = "zaria-";
		Public.frameId = Public.prefix + Public.id;
		Public.options = (options) ? options : defaults;
		Public.mode = null;
	}
	
	Public.build = function() {
		var textarea = document.getElementById(Public.id);
		var width = textarea.style.width;
		var height = textarea.style.height;
		var content = textarea.value;
		var className = textarea.className;

		if (document.designMode) {
			Public.mode = 'html';
			textarea.style.display = 'none';
			
			var toolbar = Public.options.layout;
			for (i in Public.options.buttons) {
				var button = "";
				var buttonClass = (Public.options.buttons[i].className) ? Public.options.buttons[i].className : "";
				if (Public.options.buttons[i].menu) {
					button = '<select name="'+Public.frameId+'" id="'+Public.frameId+'-'+Public.options.buttons[i].name+'" class="'+buttonClass+'" ><option>Select '+Public.options.buttons[i].label+'</option>';
					for (j in Public.options.buttons[i].menu) { button += '<option value="'+Public.options.buttons[i].menu[j]['value']+'">'+Public.options.buttons[i].menu[j]['label']+'</option>'; }
					button += '</select>';
				} else {
					button = '<a name="'+Public.frameId+'" id="'+Public.frameId+'-'+Public.options.buttons[i].name+'" class="'+buttonClass+'" width="20" height="20" alt="'+Public.options.buttons[i].label+'" title="'+Public.options.buttons[i].label+'" href="javascript:;" ></a>';
				}
				toolbar = toolbar.replace("["+Public.options.buttons[i].name+"]", button);
			}
			var iframe = '<iframe id="'+Public.frameId+'" width="'+width+'" height="'+height+'" style="width:'+width+'; height:'+height+'; border-width: thin;" class="'+className+'" frameborder="1"></iframe>';
			toolbar = toolbar.replace("[edit-area]", iframe);

			var wrapperDiv = document.createElement('div');
			wrapperDiv.innerHTML = toolbar;
			Public.insertAfter(wrapperDiv, textarea);
			Public.initButtons(Public.frameId);
			
			var doc = Public.getIFrameDocument(Public.frameId);
			// Write the textarea's content into the iframe
			doc.open();
			doc.write("<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Strict//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'><html><head></head><body>"+content+"</body></html>");
	  		doc.close();
 
	    	// Make the iframe editable
	    	doc.body.contentEditable = true;
	    	doc.designMode = "on";
		}
	}
	
	Public.getContents = function() {
		if (document.designMode) {
			// Explorer reformats HTML during document.write() removing quotes on element ID names
			// so we need to address Explorer elements as window[elementID]
			if (window[Public.frameId]) 
				return window[Public.frameId].document.body.innerHTML;
			return document.getElementById(Public.frameId).contentWindow.document.body.innerHTML;
		} else {
			// return the value from the <textarea> if document.designMode does not exist
			return document.getElementById(Public.id).value;
		}
	}

	Public.syncContent = function() {
		var content = '';
		if (Public.mode == 'text') {
			var iframe = Public.getIFrameDocument(Public.frameId);
			if (document.all) {
				var output = escape(iframe.body.innerText);
				output = output.replace("%3CP%3E%0D%0A%3CHR%3E", "%3CHR%3E");
				output = output.replace("%3CHR%3E%0D%0A%3C/P%3E", "%3CHR%3E");
				content = unescape(output);
			} else {
				var htmlSrc = iframe.body.ownerDocument.createRange();
				htmlSrc.selectNodeContents(iframe.body);
				content = htmlSrc.toString();
			}
		} else {
			content = this.getContents();
		}
		if (typeof(HTMLtoXML) != 'undefined')
			content = HTMLtoXML(content);
		document.getElementById(Public.id).value = content;
	}

	Public.initButtons = function(id) {
		for (i in Public.options.buttons) {
			currentElement = document.getElementById(id+'-'+Public.options.buttons[i].name);
			if (currentElement && currentElement.name == id) {
				currentElement.onmouseover = (Public.options.buttons[i].buttonMouseOver) ? Public.options.buttons[i].buttonMouseOver : null;
				currentElement.onmouseout = (Public.options.buttons[i].buttonMouseOut) ? Public.options.buttons[i].buttonMouseOut : null;
				currentElement.onmousedown = (Public.options.buttons[i].buttonMouseDown) ? Public.options.buttons[i].buttonMouseDown : null;	
				currentElement.onmouseup = Public.buttonMouseUp;
				if (Public.options.buttons[i].menu) { 
					currentElement.onchange = (function(element, buttonIndex) { return function() { Public.selectOnChange(element, Public.options.buttons[buttonIndex]) }; })(currentElement,i);
				} else if (Public.options.buttons[i].prompt) {
					currentElement.onclick = (function(buttonIndex) { return function() { Public.inputPrompt(Public.options.buttons[buttonIndex]) }; })(i);
				} else if (Public.options.buttons[i].toggleMode) {
					currentElement.onclick = (function(element) { return function() { Public.toggleMode(element) }; })(currentElement);
				} else if (Public.options.buttons[i].custom) {
					currentElement.onclick = Public.options.buttons[i].custom;
				} else {
					currentElement.onclick = (function(buttonIndex) { return function() { Public.buttonOnClick(Public.options.buttons[buttonIndex]) }; })(i);
				}
			}
		}
	}

	Public.buttonMouseUp = function(e) {
		// prevent default event (i.e. don't remove focus from textarea)
		var evt = e ? e : window.event;
		if (evt.returnValue) {
			evt.returnValue = false;
		} else if (evt.preventDefault) {
			evt.preventDefault();
		} else {
			return false;
		}
	}

	Public.buttonOnClick = function(button) {
		// Explorer reformats HTML during document.write() removing quotes on element ID names
		// so we need to address Explorer elements as window[elementID]
	   	var ea = (window[Public.frameId]) ? window[Public.frameId] : document.getElementById(Public.frameId).contentWindow;
		ea.focus();
		ea.document.execCommand(button.cmd, false, null);
		ea.focus();
	}

	Public.selectOnChange = function(element, button) {
		var cursel = element.selectedIndex;
		if (cursel != 0) {
			var ea = (window[Public.frameId]) ? window[Public.frameId] : document.getElementById(Public.frameId).contentWindow;
			ea.focus();
			ea.document.execCommand(button.cmd, false, element.options[cursel].value);
			ea.focus();
			element.selectedIndex = 0;
		}
	}

	Public.inputPrompt = function(button) {
		var value = prompt(button.prompt, "");
		if (value) {
			var ea = (window[Public.frameId]) ? window[Public.frameId] : document.getElementById(Public.frameId).contentWindow;
			ea.focus();
			ea.document.execCommand(button.cmd, false, value);
			ea.focus();
		}
	}

	Public.toggleMode = function(element) {
		var iframe = Public.getIFrameDocument(Public.frameId);
		if (Public.mode == 'html') {
			for (i in Public.options.buttons) { currentElement = document.getElementById(Public.frameId+'-'+Public.options.buttons[i].name); if (currentElement != element) {currentElement.style.display = 'none';} }
			if (document.all) {
				iframe.body.innerText = iframe.body.innerHTML;
			} else {
				var htmlSrc = iframe.createTextNode(iframe.body.innerHTML);
				iframe.body.innerHTML = "";
				iframe.body.appendChild(htmlSrc);
			}
			Public.mode = 'text';
		} else {
			for (i in Public.options.buttons) { currentElement = document.getElementById(Public.frameId+'-'+Public.options.buttons[i].name); if (currentElement != element) {currentElement.style.display = '';} }
			if (document.all) {
				var output = escape(iframe.body.innerText);
				output = output.replace("%3CP%3E%0D%0A%3CHR%3E", "%3CHR%3E");
				output = output.replace("%3CHR%3E%0D%0A%3C/P%3E", "%3CHR%3E");
				iframe.body.innerHTML = unescape(output);
			} else {
				var htmlSrc = iframe.body.ownerDocument.createRange();
				htmlSrc.selectNodeContents(iframe.body);
				iframe.body.innerHTML = htmlSrc.toString();
			}
			Public.mode = 'html';
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

	Public.insertAfter = function(newElement, targetElement) {
		var parent = targetElement.parentNode;
		if(parent.lastchild == targetElement) {
			parent.appendChild(newElement);
		} else {
			parent.insertBefore(newElement, targetElement.nextSibling);
		}
	}

	__construct.apply(this, arguments);	
}