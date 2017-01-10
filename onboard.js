
chrome.storage.sync.get(['authenticated', 'emailsRead', 'unsubLinksFound', 'emailsUnsubscribed', 'emailsArchived'], function(items) {
	var contentUnauthenticated = document.querySelector('#onboard-unauthenticated');
	var contentAuthenticated = document.querySelector('#onboard-authenticated');

	if (items.authenticated){
		gaPageView("/onboard-authenticated");
	  var btn = document.querySelector('#access-gmail');
	  var header = document.createElement("H3")
	  var span = document.createElement("span")
	  header.appendChild(span)
	  span.className += "label label-success";
	  span.innerHTML = '<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Authenticated to Gmail';
	  btn.parentNode.replaceChild(header, btn);
		header.outerHTML += '<p class="small">You granted access to find unsubscribe links in your emails.</p><p style="font-size:65%"><a href="https://security.google.com/settings/security/permissions?pli=1" target="_blank">Revoke access to Gmail</a></small></p>';
		contentUnauthenticated.style.display = "none";
		var intro = document.querySelector('#intro');
		intro.style.display = "none"
		var emailsRead = document.querySelector("#emails-read");
		emailsRead.innerHTML = items.emailsRead.toLocaleString('en-US');
		var unsubLinksFound = document.querySelector("#emails-unsub-links");
		unsubLinksFound.innerHTML = items.unsubLinksFound.toLocaleString('en-US');
		var unsubLinksFound = document.querySelector("#emails-unsub-links");
		unsubLinksFound.innerHTML = items.unsubLinksFound.toLocaleString('en-US');
		var emailsUnsubscribed = document.querySelector("#emails-unsub-clicks");
		emailsUnsubscribed.innerHTML = items.emailsUnsubscribed.toLocaleString('en-US');
		var emailsArchived = document.querySelector("#emails-archived");
		emailsArchived.innerHTML = items.emailsArchived.toLocaleString('en-US');
	}
	else{
		contentAuthenticated.style.display = "none";
		gaPageView("/onboard-unauthenticated");
	}
});	