chrome.runtime.onInstalled.addListener(function(details){
  if(details.reason == "install"){
    chrome.tabs.create({'url': chrome.extension.getURL('onboard.html')}, function(tab) {});
    chrome.storage.sync.set({'emailsRead': 0, 'unsubLinksFound':0, 'emailsUnsubscribed':0, 'emailsArchived':0}, function() {});
  }
  else if(details.reason == "update"){
    chrome.tabs.query({url:"*://mail.google.com/*"},function(tabs){
        tabs.forEach(function(tab){
          chrome.tabs.reload(tab.id);
        });
     });
    chrome.storage.sync.get(['emailsRead'], function(items) {
      if (typeof items.emailsRead == 'undefined'){
        chrome.storage.sync.set({'emailsRead': 0, 'unsubLinksFound':0, 'emailsUnsubscribed':0, 'emailsArchived':0}, function() {});
      }
    })
  }
});

chrome.tabs.onCreated.addListener(function(tab){
  //chrome.tabs.remove(tab.id)
  console.log(tab);
})

function getAuthTokenMessage(options){
  chrome.identity.getAuthToken({ 'interactive': false}, getAuthTokenMessageCallback);
}

function getAuthTokenMessageCallback(token){
  var m = getMessage(options.messageId,'full',token);
}

function getMessage(messageId, format, token) {
  get({
    'url': "https://www.googleapis.com/gmail/v1/users/me/messages/" + messageId + "?format=" + format,
    'token': token,
  });
}

function parseMessage(resp){
  if (resp.body.size == 0 && typeof resp.parts !== "undefined"){
    var body ='';
    for (var i = resp.parts.length - 1; i >= 0; i--) {
      if(typeof resp.parts[i].body.data !== 'undefined'){
        var part = B64.decode(resp.parts[i].body.data)
        body += part;
      }
    };
  }
  else{
    body = B64.decode(resp.body.data)
  }

  return body;
}

function xhrWithAuth(url, interactive, type) {
  function getToken() {
    chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
      if (chrome.runtime.lastError) {
        return;
      }
      access_token = token;
    });
  }

  function requestRead() {
    return result = new Promise(function(resolve, reject) {
      getToken();
      var req = new XMLHttpRequest();
      req.open('GET', url);
      if (typeof access_token !== 'undefined'){
        req.setRequestHeader('Authorization', 'Bearer ' + access_token);
        req.onload = function() {
          if (req.status == 200) {
            resolve(req.response);
          }
          else {
            if (typeof access_token !== 'undefined'){
              chrome.identity.removeCachedAuthToken({"token":access_token});
            }
            reject(Error(req.statusText));
          }
        };
        req.onerror = function() {
          reject(Error("Network Error"));
        };
        req.send();
      }
    });
  }

  function requestArchive() {
    return result = new Promise(function(resolve, reject) {
      getToken();
      var req = new XMLHttpRequest();
      req.open('POST', url);
      if (typeof access_token !== 'undefined'){
        req.setRequestHeader('Authorization', 'Bearer ' + access_token);
        req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
          req.onload = function() {
            if (req.status == 200) {
              resolve(req.response);
            }
            else {
              if (typeof access_token !== 'undefined'){
                chrome.identity.removeCachedAuthToken({"token":access_token});
              }
              reject(Error(req.statusText));
            }
          };
          req.onerror = function() {
            reject(Error("Network Error"));
          };
          req.send(JSON.stringify({'removeLabelIds': ["INBOX", "UNREAD"]}));
      }
    });
  }

  function requestListFrom() {
    return result = new Promise(function(resolve, reject) {
      getToken();
      var req = new XMLHttpRequest();
      req.open('GET', url);
      if (typeof access_token !== 'undefined'){
        req.setRequestHeader('Authorization', 'Bearer ' + access_token);
        req.onload = function() {
          if (req.status == 200) {
            resolve(req.response);
          }
          else {
            if (typeof access_token !== 'undefined'){
              chrome.identity.removeCachedAuthToken({"token":access_token});
            }
            reject(Error(req.statusText));
          }
        };
        req.onerror = function() {
          reject(Error("Network Error"));
        };
        req.send();
      }
    });
  }

  if (type == "read"){
    //gaGUemailAnalyzed();
    return Promise.resolve(requestRead());
  }
  else if (type == "archive"){
    return Promise.resolve(requestArchive());
  }
  else if (type == "listFrom"){
    return Promise.resolve(requestListFrom());
  }
}

function createBasicNotification(options) {
  var notificationOptions = {
    'type': 'basic',
    'iconUrl': options.iconUrl,
    'title': options.title,
    'message': options.message,
    'isClickable': true,
  };
  chrome.notifications.create(options.id, notificationOptions, function(notificationId) {});
}

function showAuthNotification() {
  var options = {
    'id': 'start-auth',
    'iconUrl': 'img/developers-logo.png',
    'title': 'Gmail unsubscriber',
    'message': 'Click here to authorize access to Gmail',
  };
  createBasicNotification(options);
}

function showProfileNotification(profile) {
  var options = {
    'id': 'show-profile',
    'iconUrl': profile.imageUrl,
    'title': 'Welcome ' + profile.displayName,
    'message': 'Gmail unsubscriber is now active.',
  };
  createBasicNotification(options);
}

function notificationClicked(notificationId){
  if (notificationId === 'start-auth') {
    getAuthTokenInteractive();
  }
  else if(notificationId === 'show-gmail'){
    window.open("http://mail.google.com","_blank");
  }
  clearNotification(notificationId);
}

function clearNotification(notificationId) {
  chrome.notifications.clear(notificationId, function(wasCleared) {});
}

function getAuthToken(options) {
  chrome.identity.getAuthToken({ 'interactive': options.interactive }, options.callback);
}

function getAuthTokenSilent() {
  getAuthToken({
    'interactive': false,
    'callback': getAuthTokenSilentCallback,
  });
}

if (typeof (document.querySelector('#access-gmail')) !== 'undefined'){
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('#access-gmail');
    if (btn){
      btn.addEventListener('click', clickHandler);
    }
  });
}

function clickHandler(e) {
  gaGmailAuthentication();
  this.insertAdjacentHTML('afterend', "<p id='loader' class='small'><span class='glyphicon glyphicon-refreshh glyphicon-spin'></span> Contacting Gmail...</p>");
  setTimeout(getAuthTokenInteractive, 1);
}

function getAuthTokenInteractive() {
  getAuthToken({
    'interactive': true,
    'callback': getAuthTokenInteractiveCallback,
  });

}

function getAuthTokenSilentCallback(token) {
  if (chrome.runtime.lastError) {
    //showAuthNotification();
  }
}

function getAuthTokenInteractiveCallback(token) {
  if (chrome.runtime.lastError) {
    if (typeof token !== 'undefined'){
      chrome.identity.removeCachedAuthToken({"token":token});
      chrome.storage.sync.set({'authenticated': false}, function() {
        //console.log("no auth")
      });
    }
    if (typeof chrome.runtime.lastError.message !== 'undefined'){
      gaGmailAuthenticationFailed(chrome.runtime.lastError.message);
    }
    //showAuthNotification();
  } else {
    getProfile(token);
    chrome.storage.sync.set({'authenticated': true}, function() {
      //console.log("authenticated!")
      gaGmailAuthenticationSuccess();

      var btn = document.querySelector('#access-gmail');
      var loader = document.querySelector("#loader");
      loader.remove();
      var header = document.createElement("H3")
      var span = document.createElement("span")
      header.appendChild(span)
      span.className += "label label-success";
      span.innerHTML = '<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Authenticated';
      btn.parentNode.replaceChild(header, btn);
      header.outerHTML += '<p style="font-size:65%"><a href="https://security.google.com/settings/security/permissions?pli=1" target="_blank">Revoke access to Gmail</a></small></p>';
    });
  }
}

function getProfile(token) {
  get({
    'url': 'https://www.googleapis.com/plus/v1/people/me',
    'callback': getProfileCallback,
    'token': token,
  });
}

function getProfileCallback(person) {
  var options = {
    'displayName': person.displayName,
    'imageUrl': person.image.url,
  };
  showProfileNotification(options);
  chrome.tabs.query({url:"*://mail.google.com/*"},function(tabs){
      tabs.forEach(function(tab){
        chrome.tabs.reload(tab.id);
      });
   });

}

function get(options) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      options.callback(JSON.parse(xhr.responseText));
    } else {
      if (typeof options.token !== 'undefined'){
        chrome.identity.removeCachedAuthToken({"token":options.token});
      }
    }
  };
  xhr.open("GET", options.url, true);
  xhr.setRequestHeader('Authorization', 'Bearer ' + options.token);
  xhr.send();
}

function findUnsubscribeLinks(message) {
  if (message !== undefined){
    var parser = new DOMParser();
    var doc = parser.parseFromString(message, "text/html");
    var links = doc.querySelectorAll("a[href]");
    var matches = [];
    var pattern = /unsub|opt\s*out/i;

    for (var i = 0, ii = links.length; i < ii; i++) {
      var link = links[i];
      if (link.getAttribute('href').match(pattern)) {
        matches.push(links[i]);
      } else if (link.innerHTML.match(pattern)) {
        matches.push(link);
      }
    }

    if (matches.length == 0) {
      for (var i = 0, ii = links.length; i < ii; i++) {
        var link = links[i];
        if (link.innerHTML.match(/click\s+here/i)) {
          matches.push(link);
        }
      }
      matches.reverse();
    }
    return matches;
  }
}

function isURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return pattern.test(str);
}

function isMailto(str){
  if (str.substring(0,7) == "mailto:"){
    return true
  }
}

function sendUnsubEmail(email){

  function sendEmail(mail) {
    return result = new Promise(function(resolve, reject) {

      var interactive = false
      var url = "https://www.googleapis.com/gmail/v1/users/me/messages/send"

      chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
        if (chrome.runtime.lastError) {
          return;
        }
        access_token = token;
      });

      var req = new XMLHttpRequest();
      req.open('POST', url);
      if (typeof access_token !== 'undefined'){
        req.setRequestHeader('Authorization', 'Bearer ' + access_token);
        req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        req.onload = function() {
          if (req.status == 200) {
            resolve(req.response);
          }
          else {
            if (typeof access_token !== 'undefined'){
              chrome.identity.removeCachedAuthToken({"token":access_token});
            }
            reject(Error(req.statusText));
          }
        };
        req.onerror = function() {
          reject(Error("Network Error"));
        };

        var string = "To: " + email + "\r\nSubject: Unsubscribe\r\n\r\nThis message was automatically generated by the Gmail Unsubscriber Chrome extension."

        var raw = B64.encode(string).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        req.send(JSON.stringify({
          "raw": raw,
          "payload": {
            "headers": [
              {
                "name": "To",
                "value": email
              },
              {
                "name": "Subject",
                "value": "Unsubscribe"
              }
            ]
          }
        }));
      }
    });
  }

  return Promise.resolve(sendEmail(email));

}

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name == "read"){
    port.onMessage.addListener(function(msg) {
      if (msg.id){
        var url = "https://www.googleapis.com/gmail/v1/users/me/messages/" + msg.id + "?format=full";
        xhrWithAuth(url, false, "read").then(function(result){
          var json = JSON.parse(result);
          var headersMsg = {};
          for (var i = 0 ; i < json.payload.headers.length; i++) {
            headersMsg[json.payload.headers[i].name] = json.payload.headers[i];
          }
          if ('List-Unsubscribe' in headersMsg){
            var linksListUnsubscribe = headersMsg['List-Unsubscribe'].value.match(/\<(.*?)\>/g)
            if (linksListUnsubscribe.length > 0){
              for (var i = 0; i < linksListUnsubscribe.length; i++) {
                var link = linksListUnsubscribe[i].slice(1,-1);
                if(isMailto(link)){
                  var email = link.slice(7);
                  var type = "mailto";
                }
                else if (isURL(link)){
                  var type = "url";
                }
              }
            }
          }
          // parse mail body
          else{
            var a = findUnsubscribeLinks(parseMessage(json.payload))
            if (typeof a[0] !== 'undefined'){
              var link = a[0]['href']
              var type = "url"
            }
          }
          console.log(type,link);
          port.postMessage({"type": type,"link":link, "email":email,"id":msg.id});
        })
      }
    });
  }
  else if (port.name == "archive") {
    port.onMessage.addListener(function(msg){
      gaGUunsubcribe();
      chrome.storage.sync.get(['emailsUnsubscribed', 'emailsArchived'], function(items) {
        var emailsUnsubscribed = items.emailsUnsubscribed ? items.emailsUnsubscribed + 1 : 1;
        var emailsArchived =  items.emailsArchived ? items.emailsArchived + 1 : 1;
        chrome.storage.sync.set({'emailsUnsubscribed': emailsUnsubscribed, 'emailsArchived': emailsArchived}, function() {
        });
      })
      var url = "https://www.googleapis.com/gmail/v1/users/me/messages/" + msg.id + "/modify";
      xhrWithAuth(url, false, "archive").then(function(result){
        var r = JSON.parse(result);
        var urlFrom = "https://www.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&q=" + encodeURIComponent("from:"+msg.from)
        xhrWithAuth(urlFrom, false, "listFrom").then(function(resultFrom){
          var jsonFrom = JSON.parse(resultFrom)
          console.log(jsonFrom)
          if (!r.labelIds.includes("INBOX")){
            port.postMessage({'archived': true,'nEmailsFrom': jsonFrom.resultSizeEstimate})
          }
        })

      });
      // POST with request body:
      // {
      // "removeLabelIds": [
      //   "INBOX"
      //  ]
      // }

    })
  }
  else if(port.name == "bulkArchive"){
    port.onMessage.addListener(function(msg){
      if (typeof msg.email !== 'undefined'){
        gaGUbulkArchive(parseInt(msg.nEmailsFrom,10));
        chrome.storage.sync.get(['emailsArchived'], function(items) {
          var emailsArchived =  items.emailsArchived ? items.emailsArchived + parseInt(msg.nEmailsFrom,10) : parseInt(msg.nEmailsFrom,10);
          chrome.storage.sync.set({'emailsArchived': emailsArchived}, function() {
          });
        })
        var urlFrom = "https://www.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults="+msg.nEmailsFrom+"&q=" + encodeURIComponent("from:"+msg.email)+"&fields=messages/id";
        xhrWithAuth(urlFrom, false, "listFrom").then(function(resultFrom){
          var jsonFrom = JSON.parse(resultFrom)
          if (typeof jsonFrom.messages !== 'undefined'){
            for (var i = jsonFrom.messages.length - 1; i >= 0; i--) {
              var url = "https://www.googleapis.com/gmail/v1/users/me/messages/" + jsonFrom.messages[i].id + "/modify";

              xhrWithAuth(url, false, "archive").then(function(result){
                var r = JSON.parse(result);
                console.log(r)
              })
            };
          }
        });
      }
    })
  }
  else if (port.name == "sendEmail") {
    port.onMessage.addListener(function(msg){
      if (typeof msg.email !== 'undefined'){
        console.log(msg.email);
        sendUnsubEmail("sacha.schmitz@gmail.com")
      }
    });
  }

  else if(port.name == "analytics"){
    port.onMessage.addListener(function(msg){
      console.log("read",msg.emailsRead);
      console.log("unsub",msg.unsubLinksFound);
      console.log("unsubmail",msg.unsubLinksMailFound);
      if (typeof msg.emailsRead !== 'undefined' && msg.unsubLinksFound !== 'undefined' && msg.unsubLinksMailFound !== 'undefined'){
        var manifest = chrome.runtime.getManifest();

        gaGUemails(msg.emailsRead, msg.unsubLinksFound, msg.unsubLinksMailFound, manifest.version)

        chrome.storage.sync.get(['emailsRead', 'unsubLinksFound'], function(items) {
          var emailsRead = items.emailsRead ? items.emailsRead + msg.emailsRead : msg.emailsRead;
          var unsubLinksFound =  items.unsubLinksFound ? items.unsubLinksFound + msg.unsubLinksFound : msg.unsubLinksFound;
          var unsubLinksMailFound =  items.unsubLinksMailFound ? items.unsubLinksMailFound + msg.unsubLinksMailFound : msg.unsubLinksMailFound;
          chrome.storage.sync.set({'emailsRead': emailsRead, 'unsubLinksFound': unsubLinksFound, 'unsubLinksMailFound': unsubLinksMailFound}, function() {
          });
        })
      }
    });
  }
})

chrome.notifications.onClicked.addListener(notificationClicked);
getAuthTokenSilent();
