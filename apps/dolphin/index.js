import OSApi from "../../appApi/frontend/api.js"
import Icon from "./icons.js"
let api = new OSApi();
window.locationHistory = [];
window.historyPosition = 0;
window.cwd = "/home/demo"
function done() {
    api.done({
        title: "Dolphin",
        icon: "/usr/share/icons/breeze-dark/apps/system-file-manager.svg"
    });
}
let loadedIcons = [];
async function loadContent(path, navigate) {
    if (!path?.startsWith("/")) {
        path = "/home/demo/" + path;
    }
    if (!navigate) {
        locationHistory.push(path);
        historyPosition = locationHistory.length - 1;
    }
    else {
        path = locationHistory[historyPosition];
    }
    document.querySelector(".back").classList.remove("active");
    document.querySelector(".forward").classList.remove("active");
    if (historyPosition != 0) {
        console.log("active")
        document.querySelector(".back").classList.add("active");
    }
    if (locationHistory[historyPosition + 1]) {
        document.querySelector(".forward").classList.add("active");
    }
    cwd = path;
    document.getElementById("location").value = path;
    loadedIcons.forEach(icon => icon.remove());
    loadedIcons = [];
    api.resize({ title: "Dolphin - " + path });
    document.querySelector(".location.selected")?.classList.remove("selected");
    document.querySelector(`[location="${path}"]`)?.classList.add("selected");
    let contents = await api.filesystem("list", path);
    let promises = contents.read().content.map(function (file) {
        return (async file => {
            let icon = new Icon(api, path + "/" + file);
            loadedIcons.push(icon);
            await icon.render();
        })(file)
    });
    await Promise.all(promises);
    api.loadIcons();
}
api.gotData.then(async () => {
    let data = api.data;
    let location = data.args?.location;
    if (location) {
        loadContent(location);
        return;
    }
    await loadContent("/home/demo");
    done();
})
document.getElementById("location").addEventListener("keyup", event => {
    if (event.key == "Enter") {
        loadContent(event.target.value);
    }
});
Array.from(document.getElementsByClassName("location")).forEach(element => {
    element.addEventListener("click", () => {
        let location = element.getAttribute("location");
        loadContent(location);
    })
});
document.getElementById("content").addEventListener("contextmenu", event => {
    if (event.target != document.getElementById("content")) {
        return;
    }
    api.menu({ x: event.clientX, y: event.clientY }, [
        {
            text: "New Folder",
            icon: "/usr/share/icons/breeze-dark/actions/folder-new.svg",
            action: async () => {
                let result = await api.dialog("prompt", "New folder name", ["Create"], "New Folder");
                api.filesystem("mkdir", cwd + "/" + result);
                loadContent(cwd);
            }
        },
        {
            text: "New Text File",
            icon: "/usr/share/icons/breeze-dark/actions/document-new.svg",
            action: async () => {
                let result = await api.dialog("prompt", "New File Name", ["Create"], "newFile.txt");
                api.filesystem("write", cwd + "/" + result, { content: "" });
                loadContent(cwd);
            }
        },
        {
            text: "Refresh",
            icon: "/usr/share/icons/breeze-dark/actions/view-refresh.svg",
            action: () => {
                loadContent(cwd);
            }
        }
    ])
})
window.loadContent = loadContent;
api.loadIcons();
api.channel.onevent = data => {
    switch (data.event) {
        case "sigterm":

            // Add custom exit handler here
            api.quit();
            break;
    }
}
document.getElementById("fileUpload").addEventListener("change", event => {
    let file = event.target.files[0];
    let fileName = file.name;
    let reader = new FileReader();
    reader.onload = () => {
        let content = reader.result;
        let name = fileName.split("/").slice(-1);
        api.filesystem("write", cwd + "/" + name, { content: content });
        loadContent(cwd);
    }
    reader.readAsBinaryString(file);
})
document.querySelector(".back").addEventListener("click", () => {
    if (historyPosition == 0) {
        return
    }
    historyPosition--;
    loadContent(null, true);
});
document.querySelector(".forward").addEventListener("click", () => {
    if (!locationHistory[historyPosition + 1]) {
        return;
    }
    historyPosition++;
    loadContent(null, true);
})