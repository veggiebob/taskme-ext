(() => {
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    // browser.runtime.onMessage.addEventListener((message) => {
    //     if (message.command === "my_command_1") {
    //         console.log("Received my_command_1");
    //     } else if (message.command === "reset") {
    //         console.log("Received reset command");
    //     }
    // });

    // Listen for messages from the popup (e.g., add_task)
    // console.log('setting up taskme content script message listener');
    // browser.runtime.onMessage.addListener((message) => {
    //     console.log('taskme content script received message:', message);
    //     if (!message || !message.command) return;
    //     if (message.command === 'add_task') {
    //         // Here you would integrate with the page to create the task/event.
    //         // For now, just log it so we know the popup submission worked.
    //         console.log('taskme content script received add_task:', message.text);
    //         // Optionally send a response
    //         sendResponse({ status: 'ok' });
    //     }
    //     // return true if you plan to send a response asynchronously
    // });

})();