// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
export function getYoutubeIdFromUrl(url) {
    return url.match(
        /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/,
    )?.[1] ?? '';
}

export function embed(video) {
    return `https://www.youtube.com/embed/${getYoutubeIdFromUrl(video)}`;
}

export function localize(num) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 3 });
}

export function getThumbnailFromId(id) {
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

export function secondsToTime(seconds) {
    let hours = (seconds - seconds % 3600) / 3600
    let minutes = (seconds - hours*3600 - seconds % 60) / 60
    let secs = (seconds - hours*3600 - minutes*60).toFixed(3)
    return `${hours ? `${hours < 10 ? 0 : ""}${hours}:` : ""}${minutes || hours ? `${minutes < 10 ? 0 : ""}${minutes}:` : ""}${secs < 10 ? 0 : ""}${secs}`
}

export function timeToSeconds(time) {
    let multipliers = [1, 60, 3600]
    let times = time.split(":").reverse().map((e, i) => parseFloat(e) * multipliers[i])
    return times.reduce((acc, cur) => acc + cur).toFixed(3)
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}

// https://stackoverflow.com/a/44615197
export function getFontColour(hexColor){
    function getsRGB(c) {
        return parseInt(c, 16) || c;
    }

    const brightness = Math.round(((getsRGB(hexColor.substr(1, 2)))*299 +
                      (getsRGB(hexColor.substr(3, 2))*587) +
                      (getsRGB(hexColor.substr(-2))*114))/1000);
    
    return (brightness > 125) ? 'black' : 'white';
}