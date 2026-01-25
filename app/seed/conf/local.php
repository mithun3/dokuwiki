<?php
/**
 * DokuWiki Configuration
 */

// Basic settings
$conf['title'] = 'audio / recording / sounds / technology';
$conf['lang'] = 'en';
$conf['template'] = 'dokuwiki';
$conf['tagline'] = '';
$conf['sidebar'] = 'sidebar';
$conf['license'] = 'cc-by-sa';
$conf['savedir'] = './data';
$conf['start'] = 'home';
$conf['canonical'] = 0;

// Security
$conf['useacl'] = 1;
$conf['superuser'] = '@admin';
$conf['disableactions'] = 'register';
$conf['openregister'] = 0;
$conf['securecookie'] = 1;
$conf['authtype'] = 'authplain';

// URL settings
$conf['userewrite'] = 0;
$conf['useslash'] = 0;
$conf['sepchar'] = '_';
$conf['deaccent'] = 1;
$conf['fnencode'] = 'url';

// Display settings
$conf['breadcrumbs'] = 5;
$conf['youarehere'] = 0;
$conf['recent'] = 50;
$conf['hidewarnings'] = 1;
$conf['allowdebug'] = 0;
$conf['typography'] = 1;
$conf['camelcase'] = 0;
$conf['send404'] = 1;

// Cache & compression
$conf['cachetime'] = 86400;
$conf['compression'] = 'gz';
$conf['gzip_output'] = 0;

// File & directory modes
$conf['fmode'] = 0664;
$conf['dmode'] = 0775;

// TOC settings
$conf['toptoclevel'] = 1;
$conf['maxtoclevel'] = 3;
$conf['maxseclevel'] = 3;
$conf['tocminheads'] = 3;

// Logging
$conf['dontlog'] = '';

// Email
$conf['mailfrom'] = 'wiki@example.com';

// JavaScript
$conf['jquerycdn'] = 0;
$conf['defer_js'] = 1;

// Sitemap
$conf['sitemap'] = 1;

// Update check
$conf['updatecheck'] = 0;

// Link targets
$conf['target'] = array('wiki' => '', 'interwiki' => '', 'extern' => '');
