var casper = require('casper').create({
    viewportSize : {width : 1200, height : 800},
    verbose: true,
    logLevel: "debug"
});

// TODO make helper function for taking screenshots which lists urls and file names in a JSON data file

casper.start("http://localhost:3333/", function () {
    this.capture("not-logged-in.png");
});

casper.then(function() {
    this.fillSelectors('form', {
        'input#email':    'u1@example.com',
        'input#password': 'u1'
    }, false);
    this.capture("ready-to-log-in.png");
    this.click("a[ng-click^=signin]");
    this.waitForSelector("body.account");
});

casper.then(function() {
    this.capture("logged-in.png");
    this.clickLabel("Settings", "a");
    this.waitForSelector("table#seneca-settings");
});

// Wait longer so FontAwesome loads
casper.wait(1000);

casper.then(function() {
    this.capture("settings.png");

    this.fillSelectors('form#seneca-settings-form', {
        'input#setting-a' : 'foobar'
    }, false);

    this.click("#setting-l-star-6");
    this.click("#setting-ll-star-2");

    this.capture("filled-in.png");
    this.clickLabel("Update Settings", "a");
});

casper.wait(1000);

casper.then(function() {
    this.capture("updated.png");
});

function assert(truthy, falsemsg) {
    if (truthy) {
        console.log("assertion ok");
    } else {
        console.log("fail: " + failmsg);
        throw (falsemsg || "FAIL");
    }
}

casper.thenOpen("http://localhost:3333/settings/load?kind=user", function() {
    console.log(this.getPageContent());
    var settingsInfo = JSON.parse(this.getPageContent());
    assert(settingsInfo['settings']['a'] === 'foobar');
    assert(settingsInfo['settings']['l'] === 6);
    assert(settingsInfo['settings']['ll'] === 2);
});

/// "run"
casper.run();
