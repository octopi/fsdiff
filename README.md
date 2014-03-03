# fsdiff

Simple command-line tool to investigate differences between JSON responses in different versions
of the [Foursquare API](https://developer.foursquare.com/).

## Installation

    npm install fsdiff -g

This should create a globally-available `fsdiff` command.

## Usage

### 1. Configuration

You need to configure fsdiff before running it. To do this, you're going to need a Foursquare API
client ID, client secret, and optionally an OAuth token. You can use any existing client ID or
secrets you may already have (see https://foursquare.com/developers/apps), or you can create a new
ID/secret pair. If you don't have your OAuth token readily available, [Runscope's OAuth token
generator](https://www.runscope.com/oauth2_tool) is a nifty tool to help with that.

To configure fsdiff, run:

    fsdiff config

You'll be prompted to enter in your credentials (copy + pasting them is fine). A config file will be
saved in your home directory.

### 2. Running fsdiff

    fsdiff --v1=YYYYMMDD --v2=YYYYMMDD [ENDPOINT [ENDPOINT ...]] [-o OUTPUT_DIR]

`v1` and `v2` are the only required parameters, and are the two versions of the Foursquare API
you want to compare responses for. By default, fsdiff outputs to stdout a diff of the two responses
from Foursquare in [unified diff format](http://en.wikipedia.org/wiki/Diff#Unified_format). Unless specific
endpoints are specified (see below), fsdiff will run over *all* Foursquare API endpoints. 

#### Output

If you specify the `-o` flag with a directory name, instead of printing, fsdiff will output to subfolders
in the specified directory. Each subfolder will correspond to a Foursquare API endpoint
and will include three files, two of the raw API responses in JSON, and one diff file of the two:
`v1.json`, `v2.json`, `endpoint.diff`.

#### Specifying endpoints

Instead of running over all API endpoints, you can specify specific ones as parameters to fsdiff.
The following are valid parameter values (these can also be found in lib/tests.json):

    checkins-CHECKIN_ID
    checkins-CHECKIN_ID-likes
    checkins-recent
    events-EVENT_ID
    events-categories
    events-search
    lists-LIST_ID
    lists-LIST_ID-ITEM_ID
    lists-LIST_ID-saves
    multi
    pages-PAGE_ID-venues
    pages-USER_ID
    pages-USER_ID-similar
    pages-search
    photos-PHOTO_ID
    settings-SETTING_ID
    settings-all
    specials-SPECIAL_ID
    specials-search
    tips-TIP_ID
    tips-TIP_ID-likes
    tips-TIP_ID-listed
    tips-TIP_ID-saves
    tips-search
    updates-notifications
    users-USER_ID
    users-USER_ID-badges
    users-USER_ID-checkins
    users-USER_ID-friends
    users-USER_ID-lists
    users-USER_ID-mayorships
    users-USER_ID-photos
    users-USER_ID-tips
    users-USER_ID-todos
    users-USER_ID-venuehistory
    users-USER_ID-venuestats
    users-leaderboard
    users-requests
    users-search
    users-suggest
    venues-VENUE_ID
    venues-VENUE_ID-events
    venues-VENUE_ID-herenow
    venues-VENUE_ID-hours
    venues-VENUE_ID-likes
    venues-VENUE_ID-links
    venues-VENUE_ID-listed
    venues-VENUE_ID-menu
    venues-VENUE_ID-nextvenues
    venues-VENUE_ID-photos
    venues-VENUE_ID-similar
    venues-VENUE_ID-tips
    venues-categories
    venues-explore
    venues-search
    venues-suggestcompletion
    venues-trending

Notably missing from the endpoints that fsdiff supports are any endpoints that require
merchant authentication.

### Examples

Basic usage: seeing what's changed in the explore endpoint since last year

    $ fsdiff --v1=20130101 --v2=20140301 venues-explore
    Index: venues-explore.diff
    ===================================================================
    --- venues-explore.diff v=20130101
    +++ venues-explore.diff v=20140301
    @@ -6,10 +6,10 @@
         "suggestedFilters": {
           "header": "Tap to show:",
           "filters": [
             {
    +          "name": "Open now",
    +          "key": "openNow"
    -          "name": "With specials",
    -          "key": "specials"
             },
             {
               "name": "$-$$$$",
               "key": "price"
    @@ -37,16 +37,10 @@
             "name": "recommended",
             "items": [
               {
                 "reasons": {
    +              "count": 0,
    +              "items": []
    -              "count": 2,
    -              "items": [
    -                {
    -                  "summary": "Lots of people like this place",
    -                  "type": "general",
    -                  "reasonName": "rawLikesReason"
    -                }
    -              ]
                 },
                 "venue": {
                   "id": "45c5a7c9f964a52050421fe3",
                   "name": "Powerhouse Arena",

Output the diff between a Foursquare API version last year and this year across all endpoints to
a directory called `out`:

    $ fsdiff --v1=20130101 --v2=20140301 -o out
    ...
    All done!
    $ cd out/venues-VENUE_ID
    $ ls
    20130101.json        20140301.json        venues-VENUE_ID.diff

