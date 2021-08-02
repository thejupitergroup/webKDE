import OSApi from "../../appApi/frontend/api.js"
import Icon from "./icons.js"
let api = new OSApi();
function done(){
api.done({
    title: "Dolphin",
    icon: "/usr/share/icons/breeze-dark/apps/system-file-manager.svg"
});
}
let loadedIcons = [];
async function loadContent(path) {
    if (!path.startsWith("/")) {
        path = "/home/demo/" + path;
    }
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
(async function(){
    await loadContent("/home/demo");
    done();
})()
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
})
api.loadIcons();