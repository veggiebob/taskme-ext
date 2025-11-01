// help:
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_second_WebExtension

function listenForClicks() {
    document.addEventListener('click', function (e) {
        console.log('clicked');
        browser.tabs.sendMessage(tabs[0].id, {
            command: "my_command_1"
        })
    });
}

function reportExecuteScriptError(error) {
    console.error(`Failed to execute input_task script: ${error.message}`);
}

browser.tabs.executeScript({
    file: '/content_scripts/taskme.js'
})
    .then(listenForClicks)
    .catch(reportExecuteScriptError);
