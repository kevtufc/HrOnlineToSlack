HR Online to Slack
==================

This posts upcoming holidays for your team from HR Online https://w2.hronline.co.uk to Slack.

Installation
------------

1. Install node (https://nodejs.org)
2. `npm install`

Usage
-----

1. Get a webhook URL for your team's slack (https://ciab.slack.com/apps/A0F7XDUAZ-incoming-webhooks)
2. Fill in the empty vars at the top of the getHols.pl script including the list of users you want to be included (with their EmployeeIDs from HR Online)
3. `node getHols.js` will post the info now. Put it in a cron job for maximum usefulness.
