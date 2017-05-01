/**
 * Add your Analytics tracking ID here.
 */
var _AnalyticsCode = 'UA-87680024-1';
/**
 * Below is a modified version of the Google Analytics asynchronous tracking
 * code snippet.  It has been modified to pull the HTTPS version of ga.js
 * instead of the default HTTP version.  It is recommended that you use this
 * snippet instead of the standard tracking snippet provided when setting up
 * a Google Analytics account.
 */
 // Standard Google Universal Analytics code
 (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
 (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
 m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
 })(window,document,'script','https://www.google-analytics.com/analytics.js','ga'); // Note: https protocol here

 ga('create', _AnalyticsCode, 'auto');
 ga('set', 'checkProtocolTask', null);
 ga('require', 'displayfeatures');


function gaPageView(page){
  ga('send', {
    hitType: 'pageview',
    page: page
  });
}

function gaGmailAuthentication(){
  ga('send', 'event', {
    'eventCategory': 'GU-auth',
    'eventAction': 'auth-start',
    'eventValue': 1
  });
}

function gaGmailAuthenticationFailed(msg){
  console.log(String(msg))
  ga('send', 'event', {
    'eventCategory': 'GU-auth',
    'eventAction': 'auth-failed',
    'eventLabel': String(msg),
    'eventValue': 1
  });
}

function gaGmailAuthenticationSuccess(){
  ga('send', 'event', {
    'eventCategory': 'GU-auth',
    'eventAction': 'auth-success',
    'eventValue': 1
  });
}

function gaGUemails(emailsRead, unsubLinksFound, unsubLinksMailFound, version) {
  if (emailsRead !== 0){
    ga('send', 'event', {
      'eventCategory': 'GU-data',
      'eventAction': 'emails-read',
      'eventValue': emailsRead,
      'eventLabel': String(version)
    });
  }
  if(unsubLinksFound !== 0){
    ga('send', 'event', {
      'eventCategory': 'GU-data',
      'eventAction': 'unsub-links-found',
      'eventValue': unsubLinksFound
    });
  }
  if(unsubLinksMailFound !== 0){
    ga('send', 'event', {
      'eventCategory': 'GU-data',
      'eventAction': 'unsub-links-mail-found',
      'eventValue': unsubLinksMailFound
    });
  }
}

function gaGUunsubcribe(){
  ga('send', 'event', {
    'eventCategory': 'GU-data',
    'eventAction': 'unsubscribed-mails',
    'eventValue': 1
  });
  ga('send', 'event', {
    'eventCategory': 'GU-data',
    'eventAction': 'archived-mails',
    'eventValue': 1
  });
}

function gaGUbulkArchive(nEmailsArchived){
  ga('send', 'event', {
    'eventCategory': 'GU-data',
    'eventAction': 'archived-mails',
    'eventValue': nEmailsArchived
  });
}
