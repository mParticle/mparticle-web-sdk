var page = require('webpage').create();

page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.open("http://localhost:3000/test/index.html", function(status) {
    if (status === "success") {
        var maxtimeOutMillis = 10000,
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                condition = page.evaluate(function() {
                    return window.testsComplete === true;
                });
            } else {
                if(!condition) {
                    console.log("Timed out waiting for test completion");
                    phantom.exit(1);
                } else {
                    page.evaluate(function() {
                        elements = document.getElementsByClassName("suite")[0].getElementsByTagName("li");
                        for (var i = 0; i < elements.length; i += 1) {
                            var element = elements[i];
                            var html = element.innerHTML;
                            var title = html.match(/<h2>([^<]*)</)[1];
                            if (element.className === "test fail") {
                                console.log("\033[31;1m✖\033[0m " + title);
                                var longError = html.match(/<pre class="error">([^<]*)</)[1];
                                var pipeError = longError.split("\n").join("|");
                                var description = pipeError.match(/(.*?)http/)[1].split("|").join("\n    ");
                                if (description.match(/assert@$/)) {
                                    description = description.replace("assert@","");
                                }
                                var testsLocation = longError.match(/(tests\.js:\d+:\d+)/)[1];
                                console.log("    " + description + " - " + testsLocation + "\n");
                            }
                            else if (element.className === "test pass fast") {
                                console.log("\033[32;1m✓\033[0m " + title);
                            }
                            else {
                                var duration = html.match(/duration">([^<]*)</)[1];
                                if (element.className === "test pass slow") {
                                    console.log("\033[33;1m✓ \033[31;1m(" + duration + ")\033[0m " + title);
                                }
                                else {
                                    console.log("\033[33;1m✓ (" + duration + ")\033[0m " + title);
                                }
                            }
                        }
                    });

                    var stats = page.evaluate(function() {
                        var result = document.getElementById("mocha-stats").textContent;
                        result = result.replace("failures", " failures").replace("duration", " duration");
                        var blanket = document.getElementsByClassName("blanket grand-total bl-success")[0].innerHTML;
                        var statements = blanket.match(/(\d+\/\d+)/)[1];
                        var percent = blanket.match(/(\d+\.\d+) %/)[1];
                        result += "\ncovered/total smts.: " + statements + " coverage: " + percent + "%";
                        return result;
                    });
                    console.log("\n" + stats);

                    if (stats.indexOf("failures: 0") === -1) {
                        phantom.exit(1);
                    }
                    else {
                        phantom.exit(0);
                    }
                    clearInterval(interval);
                }
            }
        }, 250);
    } else {
        console.log("Request to server failed");
        phantom.exit(1);
    }
});
