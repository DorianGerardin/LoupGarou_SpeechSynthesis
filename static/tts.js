let allCharacters = [
    ["Le", "Doppelganger", 1],
    ["Les", "Loups-garous", 2],
    ["Le", "Sbire", 3],
    ["Le", "Franc-maçon", 4],
    ["La", "Voyante", 5],
    ["Le", "Voleur", 6],
    ["La", "Noiseuse", 7],
    ["Le", "Soulard", 8],
    ["L'", "Insomniaque", 9]
]

if ('speechSynthesis' in window) {
    let isPlaying = false
    const voiceSelect = document.getElementById('voiceSelect');
    const synth = window.speechSynthesis;
    const startButton = document.getElementById('startButton');
    let isPaused = false
    let selectedCharacters = []
    let remainingCharacters = []
    let speakingVoice;
    let secondsPerCharacters
    let voiceName = "Google français"

    function listVoices() {
        const voices = synth.getVoices();
        voiceSelect.innerHTML = '';
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    }

    synth.onvoiceschanged = listVoices;
    listVoices();

    function createCharacterCard(character) {
        let selectContainer = document.getElementById("selectContainer")
        let characterCard = document.createElement("div")
        characterCard.classList.add("characterCard")
        characterCard.innerText = character[1].toUpperCase()
        characterCard.addEventListener("click", () => {
            if(isPlaying) {
                return
            }
            let selected = characterCard.classList.contains("selected")
            if(selected) {
                characterCard.classList.remove("selected")
                selectedCharacters = selectedCharacters.filter(c => c[2] !== character[2])
            } else {
                characterCard.classList.add("selected")
                selectedCharacters.push(character)
            }
        })
        selectContainer.appendChild(characterCard)
    }

    function listCharacters() {
        allCharacters.forEach(character => {
            createCharacterCard(character)
        });
    }

    listCharacters()

    function getNextCharacter() {
        return remainingCharacters.shift()
    }

    function hasNextCharacter() {
        return remainingCharacters.length !== 0
    }

    function speak(text) {
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = speakingVoice
        synth.speak(utterance);
        return utterance
    }

    function countdown(seconds, hasToSpeak = true) {
        let remainSeconds = Math.round(seconds)
        return new Promise((resolve, reject) => {
            function runCountdown(remaining) {
                if (remaining === 0) {
                    resolve("Countdown finished!");
                } else {
                    console.log(remaining + " second(s) remaining");
                    if(hasToSpeak) {
                        let utterance = speak(remainSeconds.toString());
                        utterance.addEventListener('end', ()=> {
                            setTimeout(() => {
                                remainSeconds--;
                                runCountdown(remainSeconds);
                            }, 350)
                        })
                    } else {
                        setTimeout(() => {
                            remainSeconds--;
                            runCountdown(remainSeconds);
                        }, 1000)
                    }
                }
            }
            runCountdown(remainSeconds);
        });
    }

    function setPauseAndStopButtons() {
        let buttonsContainer = document.getElementById("buttonContainer")
        let startButton = document.getElementById("startButton")
        let inputContainer = document.getElementById("inputContainer")
        inputContainer.style.display = "none"
        startButton.style.display = "none"

        let pauseButton = document.createElement("div")
        pauseButton.classList.add("button")
        pauseButton.innerText = "Pause"
        pauseButton.addEventListener("click", () => {
            if(isPaused) {
                isPaused = false
                pauseButton.innerText = "Pause"
                synth.resume()
            } else {
                isPaused = true
                pauseButton.innerText = "Lecture"
                synth.pause()
            }
        })
        let stopButton = document.createElement("div")
        stopButton.classList.add("button")
        stopButton.innerText = "Stop"
        stopButton.addEventListener("click", ()=> {
            synth.cancel()
            window.location.reload()
        })
        buttonsContainer.appendChild(pauseButton)
        buttonsContainer.appendChild(stopButton)
    }

    function setSpeech() {
        const selectedVoice = voiceSelect.value;
        remainingCharacters = selectedCharacters.sort((c1, c2) => { return c1[2] - c2[2] })
        console.log(remainingCharacters)
        if(remainingCharacters.length < 3) {
            alert("Veuillez sélectionner au moins 3 personnages")
            return
        }
        secondsPerCharacters = parseInt(document.getElementById("characterCounterInput").value)
        if(!secondsPerCharacters) {
            alert("Veuillez spécifier un nombre de seconde par personnages")
            return
        }
        const voices = synth.getVoices();
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) {
            speakingVoice = voice
            startSpeech()
        } else {
            alert('La voix sélectionnée n\'a pas été trouvée.');
        }
    }

    function startSpeech() {
        setPauseAndStopButtons()
        isPlaying = true
        let utterance = speak("La partie commence dans");
        utterance.addEventListener("end", () => {
            countdown(3).then((result) => {
                utterance = speak("Le village s'endort");
                utterance.addEventListener("end", () => {
                    resolveNextCharacter()
                })
            })
        })
    }

    function resolveNextCharacter() {
        if(!hasNextCharacter()) {
            isPlaying = false
            console.log("resolved all characters")
            let utterance = speak("Le village se réveille");
            return
        }

        let nextCharacter = getNextCharacter()
        let utterance = speak(`${nextCharacter[0]} ${nextCharacter[1]} se réveille`);
        utterance.addEventListener("end", () => {
            countdown(1, false).then((result) => {
                countdown(secondsPerCharacters).then((result) => {
                    utterance = speak(`${nextCharacter[0]} ${nextCharacter[1]} se ${nextCharacter[0] === "Les" ? "rendorment" : "rendort"}`);
                    utterance.addEventListener("end", () => {
                        countdown(1, false).then((result) => {
                            resolveNextCharacter()
                        })
                    })
                })
            })
        })
    }

    startButton.addEventListener('click', setSpeech);

} else {
    alert("Désolé, votre navigateur ne prend pas en charge l'API SpeechSynthesis.");
}
