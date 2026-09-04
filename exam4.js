// 게임 상태를 관리하는 변수들
let score = 0;
let timeLeft = 20;
let gameInterval;
let isGameRunning = false; // 게임이 실행 중인지 확인하는 변수
let isTargetTransitioning = false;
let currentName = "";
const leaderboardStorageKey = "typing-game-leaderboard";

// DOM 요소 참조
const targetCharElement = document.getElementById("targetChar");
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const startButton = document.getElementById("startButton");
const gameStatusElement = document.getElementById("gameStatus");
const gamePanelElement = document.querySelector(".game-panel");
const nameElement = document.getElementById("playerName");
const nameErrorElement = document.getElementById("nameError");
const leaderboardListElement = document.getElementById("leaderboardList");

// 점수 계산에서 제외할 키 리스트
const excludedKeys = ["Shift", "CapsLock"];

// 랜덤 문자를 생성하는 함수
function getRandomChar() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return chars[Math.floor(Math.random() * chars.length)];
}

// 새로운 타겟 문자를 설정하는 함수
function setNewTargetChar() {
  targetCharElement.innerText = getRandomChar();
}

function getLeaderboard() {
  try {
    const savedScores = JSON.parse(localStorage.getItem(leaderboardStorageKey));
    return Array.isArray(savedScores) ? savedScores : [];
  } catch (error) {
    return [];
  }
}

function saveScore() {
  const leaderboard = [...getLeaderboard(), { name: currentName, score }]
    .sort((first, second) => second.score - first.score)
    .slice(0, 10);

  localStorage.setItem(leaderboardStorageKey, JSON.stringify(leaderboard));
  renderLeaderboard();
}

function renderLeaderboard() {
  const leaderboard = getLeaderboard();
  leaderboardListElement.innerHTML = "";

  if (leaderboard.length === 0) {
    leaderboardListElement.innerHTML =
      '<li class="leaderboard__empty">아직 기록이 없습니다.</li>';
    return;
  }

  leaderboard.forEach((record, index) => {
    const item = document.createElement("li");
    item.className = "leaderboard__item";
    const displayName = record.name || record.nickname;
    item.innerHTML = `<span>${index + 1}. ${displayName}</span><strong>${record.score}점</strong>`;
    leaderboardListElement.appendChild(item);
  });
}

// 입력된 문자를 확인하고 점수를 업데이트하는 함수
function checkInput(event) {
  const inputChar = event.key;

  if (isTargetTransitioning) {
    return;
  }

  // CapsLock, Shift 등의 키는 무시
  if (excludedKeys.includes(inputChar)) {
    return;
  }

  // 입력 문자가 타겟 문자와 일치하면 점수 증가, 아니면 점수 감소
  if (inputChar === targetCharElement.innerText) {
    score += 10;
    isTargetTransitioning = true;
    targetCharElement.classList.add("is-correct");
    setTimeout(() => {
      targetCharElement.classList.remove("is-correct");
      isTargetTransitioning = false;
      if (isGameRunning) {
        setNewTargetChar();
      }
    }, 250);
  } else {
    score = score <= 0 ? score : score - 5;
    isTargetTransitioning = true;
    targetCharElement.classList.add("is-wrong");
    setTimeout(() => {
      targetCharElement.classList.remove("is-wrong");
      isTargetTransitioning = false;
      if (isGameRunning) {
        setNewTargetChar();
      }
    }, 250);
  }

  // 업데이트된 점수 표시
  scoreElement.innerText = score;
}

// 타이머를 업데이트하고 시간이 다 되면 게임을 종료하는 함수
function updateTimer() {
  timeLeft--;
  timerElement.innerText = `${timeLeft}초`;

  if (timeLeft <= 5) {
    targetCharElement.classList.add("is-warning");
  }

  if (timeLeft <= 0) {
    endGame("timeover");
  }
}

// 게임을 종료하고 필요한 정리 작업을 수행하는 함수
function endGame(status = "gameover") {
  clearInterval(gameInterval);
  saveScore();
  targetCharElement.innerText = "";
  targetCharElement.hidden = true;
  targetCharElement.classList.remove("is-wrong");
  targetCharElement.classList.remove("is-correct");
  isTargetTransitioning = false;
  gameStatusElement.innerText = status;
  startButton.hidden = false;
  startButton.innerText = "다시 시작";
  timerElement.innerText = "0초";
  targetCharElement.classList.remove("is-warning");
  gamePanelElement.classList.add("is-ended");
  gamePanelElement.classList.remove("is-playing");
  document.removeEventListener("keydown", checkInput); // 키 입력 이벤트 제거
  isGameRunning = false; // 게임 실행 상태를 종료로 설정
}

// 게임을 초기화하고 시작하는 함수
function startGame() {
  if (isGameRunning) return; // 게임이 이미 실행 중이면 새로 시작하지 않음

  if (gamePanelElement.classList.contains("is-ended")) {
    resetGame(true);
    return;
  }

  const name = nameElement.value.trim();

  if (!name) {
    nameErrorElement.innerText = "이름을 입력해주세요!";
    nameElement.focus();
    return;
  }

  currentName = name;
  nameErrorElement.innerText = "";
  isGameRunning = true; // 게임 실행 상태를 시작으로 설정

  score = 0;
  timeLeft = 20;
  startButton.hidden = true;
  targetCharElement.hidden = false;
  targetCharElement.classList.remove("is-wrong");
  targetCharElement.classList.remove("is-correct");
  isTargetTransitioning = false;
  gameStatusElement.innerText = "";
  scoreElement.innerText = score;
  timerElement.innerText = `${timeLeft}초`;
  targetCharElement.classList.remove("is-warning");
  gamePanelElement.classList.remove("is-ended");
  gamePanelElement.classList.add("is-playing");
  setNewTargetChar(); // 첫 번째 타겟 문자 설정

  gameInterval = setInterval(updateTimer, 1000); // 1초마다 타이머 업데이트
  document.addEventListener("keydown", checkInput); // 키 입력 이벤트 추가
}

// 게임을 리셋하는 함수
function resetGame(keepName = false) {
  clearInterval(gameInterval); // 타이머 정지
  score = 0;
  timeLeft = 20;
  scoreElement.innerText = 0;
  timerElement.innerText = "20초";
  targetCharElement.classList.remove("is-warning");
  targetCharElement.innerText = "";
  targetCharElement.hidden = true;
  targetCharElement.classList.remove("is-wrong");
  targetCharElement.classList.remove("is-correct");
  isTargetTransitioning = false;
  gameStatusElement.innerText = "";
  gamePanelElement.classList.remove("is-ended");
  gamePanelElement.classList.remove("is-playing");
  startButton.hidden = false;
  startButton.innerText = "게임 시작";
  if (!keepName) {
    nameElement.value = "";
  }
  document.removeEventListener("keydown", checkInput); // 키 입력 이벤트 제거
  isGameRunning = false; // 게임 실행 상태를 종료로 설정
}

// 페이지 로드 시 초기 설정
function initGame() {
  scoreElement.innerText = 0;
  timerElement.innerText = "20초";
  targetCharElement.classList.remove("is-warning");
  targetCharElement.innerText = "";
  targetCharElement.hidden = true;
  targetCharElement.classList.remove("is-wrong");
  targetCharElement.classList.remove("is-correct");
  isTargetTransitioning = false;
  gameStatusElement.innerText = "";
  gamePanelElement.classList.remove("is-ended");
  gamePanelElement.classList.remove("is-playing");
  startButton.hidden = false;
}

// 게임 초기화 함수 호출
initGame();
renderLeaderboard();
