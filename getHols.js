//
// Slack notifier for HR Online - Kevin Hughes <kevtufc@gmail.com>
//
// Posts reminders to a slack channel about team members' upcoming holidays
//
// Put it in a crontab for maximum usefulness.
//

slack_webhook_url = ''   // Put a slack webhook URL in here
slack_channel = ''       // The channel you want it to post notices to
hr_online_username = ''  // Username of a user who can see all the users in HR Online
hr_online_password = ''  // And their password

const people2 = {
  name1  : 123123,     // A list of people who you want to checked for upcoming holidays
  name2  : 321321,     // The name can be whatever, the number is the EmployeeID seen in the URL on their page
}


var request = require('request');
var request = request.defaults({jar: true});
var cheerio = require('cheerio');
var moment  = require('moment');
var Slack   = require('node-slack');
var slack   = new Slack(slack_webhook_url);
var compoundSubject = require('compound-subject');

var dateFormat = "DD/MM/YYYY HH:mm"

function funkyDay(date){
  text = ""
  if(moment(date).isAfter(moment().endOf('week'))){ text += 'next '}
  if(moment(date).dayOfYear() === moment().dayOfYear()){
    text += "today"
  } else if(moment(date).dayOfYear() === (moment().dayOfYear() + 1)){
    text += "tomorrow"
  } else {
    text += moment(date).format('dddd')
  }
  return text
}

function getHols(person,employeeId){
  return new Promise(function(fulfill,reject){
    request.post(
      {
        url: 'https://w2.hronline.co.uk/Account/Login',
        form: {
          'Username' : hr_online_username,
          'Password': hr_online_password
        },
      },
      function(error, response, body){
        request.get(
          {
            url: 'https://w2.hronline.co.uk/Manager/MyEmployeeHolidayListing/GetHolidayListing',
            form: {
              EmployeeId: employeeId,
              startDate: '2016-07-01T00:00:00.0000000',
              endDate: '2017-06-30T23:59:59.0000000'
            }
          },
          function(error, response, body){
            $ = cheerio.load(body);
            hols = []
            $('table tr').each(function(i,tr){
              var text = ""
              if($(this).find('td').length < 2){ return(true) }
	      if($(this).find('td.icon_cell span[data-status=Approved]').length < 1){ return(true) }
              var from = moment($(this).find('td.date_cell').first().text().trim(),dateFormat)
              var to  =  moment($(this).find('td.date_cell').last().text().trim(),dateFormat)
              if(from.isAfter(moment().endOf('week').add(7,'days'))){ return(true) }
              if(to.isBefore(moment())){ return(true) }
              if(moment(from).dayOfYear() === moment(to).dayOfYear()){
                text += funkyDay(from)
              } else {
                text += "from " + funkyDay(from) + " to " + funkyDay(to)
              }
              if (text != ""){ hols.unshift(text) }
            })
            if(hols.length==0){
              fulfill(false)
            } else {
              fulfill(person + " is on holiday " + compoundSubject(hols).make() + ".")
            }
          }
        )
      }
    )
  })
};

for(var person in people){
  getHols(person, people[person]).then(function(a) {
    slack.send({
      username: "Holiday Bot",
      icon_emoji: ":palm_tree:",
      channel: slack_channel,
      text: a
    })
    console.log(a)
  })
}
