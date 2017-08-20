InboxSDK.load('1.0', 'sdk_gmail-unsub_b0981f697a').then(function(sdk){

  var emailsRead = 0;
  var unsubLinksFound = 0;
  var unsubLinksMailFound = 0;
  setInterval(countFnExecutions, 5000);

  function countFnExecutions(){
    var port = chrome.runtime.connect({name: "analytics"});
    port.postMessage({'emailsRead': emailsRead, 'unsubLinksFound': unsubLinksFound, 'unsubLinksMailFound': unsubLinksMailFound});
    emailsRead = unsubLinksFound = unsubLinksMailFound = 0
  }

  sdk.Lists.registerThreadRowViewHandler(function(ThreadRowView){
   emailsRead++;

   function archiveMail(e,type){
     var port = chrome.runtime.connect({name:'archive'});
     var idMsg = ThreadRowView.getThreadIDIfStable()
     var sender = ThreadRowView.getContacts();
     port.postMessage({id:idMsg, from:sender[0].emailAddress});
     var html = '';
     var time = 0;
     if (type == "email"){
       // we just unsubscribed by sending an email
          html += "You were unsubscribed automagically. "
          time -= 10000
     }

     port.onMessage.addListener(function(msg){
      if (msg.archived){
        if (html !== ''){
          html += "Also, t";
        }
        else{
          html+= "T";
        }
        if (msg.nEmailsFrom == 0){
          html += "he conversation was archived";
        }
        else if (msg.nEmailsFrom == 1){
          html += "he conversation was archived. <br> We found "+msg.nEmailsFrom+" other email from "+ sender[0].emailAddress + " in your mailbox. <span style='text-decoration:underline' class='bulkArchive' email='"+sender[0].emailAddress+"' nEmailsFrom='"+msg.nEmailsFrom+"'>Archive it ?</span>"
        }
        else if (msg.nEmailsFrom > 1){
          html += "he conversation was archived. <br> We found "+msg.nEmailsFrom+" other emails from "+ sender[0].emailAddress + " in your mailbox. <span style='text-decoration:underline' class='bulkArchive' email='"+sender[0].emailAddress+"' nEmailsFrom='"+msg.nEmailsFrom+"'>Archive all ?</span>"
        }
        sdk.ButterBar.showMessage({
          'text':'',
          'time':time+20000,
          'html':html
        })
        var row = document.querySelector("tr.inboxsdk__thread_row[data-inboxsdk-threadid='"+idMsg+"'");
        row.setAttribute("style", "display:none")
      }
     })


   }

   function sendArchiveMail(email){

     var port = chrome.runtime.connect({name:'sendEmail'});
     var idMsg = ThreadRowView.getThreadIDIfStable()
     var sender = ThreadRowView.getContacts();
     port.postMessage({email:email});
   }

    var port = chrome.runtime.connect({name: "read"});
    port.postMessage({id: ThreadRowView.getThreadIDIfStable()});
    port.onMessage.addListener(function(msg) {
      if (typeof msg.type !== 'undefined'){
        if (msg.type == "mailto"){
          if (typeof msg.email !== 'undefined'){
            unsubLinksFound++
            unsubLinksMailFound++
            var email = msg.email
            //port.postMessage({type:"link-found", countEmails: ThreadRowView.getVisibleMessageCount()});
            ThreadRowView.addActionButton({
              'type':"LINK",
              'title': "Unsubscribe",
              'url': "http://you-should-be-unsubscribed-and-not-see-this-page.com/",
              'onClick': function(){
                sendArchiveMail(email);
                // sdk.ButterBar.showMessage({
                //       'text':"An email was sent to unsubscribe you from this mailing list.",
                //       'time':5000,
                //       'priority':1
                // })
                archiveMail(email, "email");
              }
            });
            //console.log(ThreadRowView);
          }
        }
        else if (msg.type == "url"){
          var link = msg.link
          if (link.length > 0 ){
            unsubLinksFound++
            //port.postMessage({type:"link-found", countEmails: ThreadRowView.getVisibleMessageCount()});
            ThreadRowView.addActionButton({
              'type':"LINK",
              'title': "Unsubscribe",
              'url': link,
              'onClick': archiveMail
            });
          }
          // else{
          //   port.postMessage({countEmails: ThreadRowView.getVisibleMessageCount()});
          // }
        }

      }
    });

  });

  function bulkArchive(email,nEmailsFrom){

    var port = chrome.runtime.connect({name: "bulkArchive"});
    port.postMessage({'email': email, 'nEmailsFrom': nEmailsFrom });
    var currentRouteView = sdk.Router.getCurrentRouteView();
    //console.log(listRouteView.getRouteID())
    //console.log(currentRouteView.getRouteID())

    sdk.Router.handleListRoute(currentRouteView.getRouteID(), function(listRouteView) {
      setTimeout(function(){ listRouteView.refresh(); }, 1000);
    })
    if (nEmailsFrom == 1){
      var text = nEmailsFrom + ' conversation from ' + email + ' has been archived.'
    }
    else if(nEmailsFrom > 1){
      var text = nEmailsFrom + ' conversations from ' + email + ' have been archived.'
    }

    sdk.ButterBar.showMessage({
          'text':text,
          'time':15000,
    })

  }

  document.querySelector('body').addEventListener('click', function(event) {
    if (event.target.className == 'bulkArchive') {
      var email = event.target.getAttribute('email')
      var nEmailsFrom = event.target.getAttribute('nEmailsFrom')
      if (nEmailsFrom == 1){
        var title = 'Confirm archiving message';
        var el = '<div>This action will archive '+nEmailsFrom+' other conversation from '+email+'. Are you sure you want to continue?</div>';
      }
      else if (nEmailsFrom > 1){
        var title = 'Confirm bulk archiving messages';
        var el = '<div>This action will archive all '+nEmailsFrom+' conversations from '+email+'. Are you sure you want to continue?</div>';
      }
      var modal = sdk.Widgets.showModalView({
        'el': el,
        'title': title,
        'buttons':[
          {
            'text':'OK',
            'onClick': function(){bulkArchive(email, nEmailsFrom); modal.close();},
            'type':'PRIMARY_ACTION'
          },
          {
            'text':'Cancel',
            'onClick': function(){modal.close();}
          }
        ]
      })
    }
  });


});



// mailjet http://znu5.mjt.lu/lnk/AEMAGMBd31sAAAYKl9gAAAdnmMkAAAAIijYAAAAAAAYklQBYGLfbGc4mKBtgSNuILVgcNm639QAF1QU/32/nR2IWvwog9MB3Opn3Zp97Q/aHR0cHM6Ly93d3cucHJvZHVjdGh1bnQuY29tL215L3Vuc3Vic2NyaWJlP2VtYWlsPXNhY2hhLnNjaG1pdHolNDBnbWFpbC5jb20ma2luZD1uZXdzbGV0dGVyJm5vdGlmaWNhdGlvbl9pZD00NTAyNDExNyZ0b2tlbj1iYzUyOGQ1OTIzZTVmMDc1N2ZlNWVkMDBjZGNhMTk1NzdmODU4MzU1JnZhbGlkX3VudGlsPTE0Nzg4ODI1MzQ
//
