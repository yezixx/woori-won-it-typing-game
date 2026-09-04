// 게임 상태를 관리하는 변수들
let score = 0;
let timeLeft = 20;
let gameInterval;
let targetAdvanceTimeout;
let isGameRunning = false; // 게임이 실행 중인지 확인하는 변수
let isTargetTransitioning = false;
let combo = 0;
let maxCombo = 0;
let correctCount = 0;
let level = 1;
let highScore = Number(localStorage.getItem("typingHighScore")) || 0;

// DOM 요소 참조
const targetCharElement = document.getElementById("targetChar");
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const comboElement = document.getElementById("combo");
const levelElement = document.getElementById("level");
const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const gameStatusElement = document.getElementById("gameStatus");
const gamePanelElement = document.querySelector(".game-panel");

// 점수 계산에서 제외할 키 리스트
const excludedKeys = ["Shift", "CapsLock"];

// 종료 화면의 다시 시작 버튼이 포인터를 피하도록 이동시키는 함수
function evadeRestartButton() {
  if (!gamePanelElement.classList.contains("is-ended")) {
    return;
  }

  const buttonWidth = startButton.offsetWidth;
  const buttonHeight = startButton.offsetHeight;
  const maxLeft = Math.max(12, window.innerWidth - buttonWidth - 12);
  const maxTop = Math.max(12, window.innerHeight - buttonHeight - 12);
  const nextLeft = Math.floor(Math.random() * (maxLeft - 12)) + 12;
  const nextTop = Math.floor(Math.random() * (maxTop - 12)) + 12;

  startButton.classList.add("is-evading");
  startButton.style.left = `${nextLeft}px`;
  startButton.style.top = `${nextTop}px`;
}

function restoreStartButton() {
  startButton.classList.remove("is-evading");
  startButton.style.left = "";
  startButton.style.top = "";
}

// 랜덤 문자를 생성하는 함수
function getRandomChar() {
  const chars =
    level >= 2
      ? "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
      : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  return chars[Math.floor(Math.random() * chars.length)];
}

// 새로운 타겟 문자를 설정하는 함수
function setNewTargetChar() {
  targetCharElement.innerText = getRandomChar();
  scheduleTargetAdvance();
}

// 남은 시간이 적을수록 다음 문자가 더 빠르게 나타나도록 전환 시간을 계산
function getTargetTransitionDelay() {
  return Math.max(70, timeLeft * 10 + 50);
}

// 입력하지 않아도 제한 시간이 지나면 다음 문자로 넘어가도록 예약
function scheduleTargetAdvance() {
  clearTimeout(targetAdvanceTimeout);

  if (!isGameRunning) {
    return;
  }

  const displayDuration = Math.max(400, timeLeft * 60);
  targetAdvanceTimeout = setTimeout(() => {
    if (!isGameRunning || isTargetTransitioning) {
      return;
    }

    combo = 0;
    comboElement.innerText = combo;
    setNewTargetChar();
  }, displayDuration);
}

// 입력된 문자를 확인하고 점수를 업데이트하는 함수
function checkInput(event) {
  const inputChar = event.key;

  if (isTargetTransitioning) {
    return;
  }

  clearTimeout(targetAdvanceTimeout);

  // CapsLock, Shift 등의 키는 무시
  if (excludedKeys.includes(inputChar)) {
    return;
  }

  // 입력 문자가 타겟 문자와 일치하면 콤보 보너스를 적용
  if (inputChar === targetCharElement.innerText) {
    correctCount++;
    combo++;
    maxCombo = Math.max(maxCombo, combo);
    level = Math.floor(correctCount / 5) + 1;
    score += 10 + Math.min(combo * 2, 20);
    isTargetTransitioning = true;
    targetCharElement.classList.add("is-correct");
    setTimeout(() => {
      targetCharElement.classList.remove("is-correct");
      isTargetTransitioning = false;
      if (isGameRunning) {
        setNewTargetChar();
      }
    }, getTargetTransitionDelay());
  } else {
    combo = 0;
    score = Math.max(0, score - 5);
    isTargetTransitioning = true;
    targetCharElement.classList.add("is-wrong");
    setTimeout(() => {
      targetCharElement.classList.remove("is-wrong");
      isTargetTransitioning = false;
      if (isGameRunning) {
        setNewTargetChar();
      }
    }, getTargetTransitionDelay());
  }

  // 업데이트된 점수 표시
  scoreElement.innerText = score;
  comboElement.innerText = combo;
  levelElement.innerText = level;
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
  clearTimeout(targetAdvanceTimeout);
  const isNewRecord = score > highScore;

  if (isNewRecord) {
    highScore = score;
    localStorage.setItem("typingHighScore", highScore);
  }

  targetCharElement.innerText = "";
  targetCharElement.hidden = true;
  targetCharElement.classList.remove("is-wrong");
  targetCharElement.classList.remove("is-correct");
  isTargetTransitioning = false;
  gameStatusElement.innerText = `${isNewRecord ? "NEW RECORD!\n" : ""}${status}\n점수 ${score}점 · 정답 ${correctCount}개 · 최고 콤보 ${maxCombo}\n최고 점수 ${highScore}점`;
  startButton.hidden = false;
  startButton.innerText = "다시 시작";
  timerElement.innerText = "0초";
  targetCharElement.classList.remove("is-warning");
  gamePanelElement.classList.add("is-ended");
  document.removeEventListener("keydown", checkInput); // 키 입력 이벤트 제거
  isGameRunning = false; // 게임 실행 상태를 종료로 설정
}

// 게임을 초기화하고 시작하는 함수
function startGame() {
  if (isGameRunning) return; // 게임이 이미 실행 중이면 새로 시작하지 않음
  isGameRunning = true; // 게임 실행 상태를 시작으로 설정
  restoreStartButton();

  score = 0;
  timeLeft = 20;
  combo = 0;
  maxCombo = 0;
  correctCount = 0;
  level = 1;
  startButton.hidden = true;
  targetCharElement.hidden = false;
  targetCharElement.classList.remove("is-wrong");
  targetCharElement.classList.remove("is-correct");
  isTargetTransitioning = false;
  gameStatusElement.innerText = "";
  scoreElement.innerText = score;
  timerElement.innerText = `${timeLeft}초`;
  comboElement.innerText = combo;
  levelElement.innerText = level;
  targetCharElement.classList.remove("is-warning");
  gamePanelElement.classList.remove("is-ended");
  setNewTargetChar(); // 첫 번째 타겟 문자 설정

  gameInterval = setInterval(updateTimer, 1000); // 1초마다 타이머 업데이트
  document.addEventListener("keydown", checkInput); // 키 입력 이벤트 추가
}

// 게임을 리셋하는 함수
function resetGame() {
  clearInterval(gameInterval); // 타이머 정지
  clearTimeout(targetAdvanceTimeout);
  restoreStartButton();
  resetButton.innerText = "인생은 실전";
  resetButton.disabled = true;
  score = 0;
  timeLeft = 20;
  combo = 0;
  maxCombo = 0;
  correctCount = 0;
  level = 1;
  scoreElement.innerText = 0;
  timerElement.innerText = "20초";
  comboElement.innerText = combo;
  levelElement.innerText = level;
  targetCharElement.classList.remove("is-warning");
  targetCharElement.innerText = "";
  targetCharElement.hidden = true;
  targetCharElement.classList.remove("is-wrong");
  targetCharElement.classList.remove("is-correct");
  isTargetTransitioning = false;
  gameStatusElement.innerText = "";
  gamePanelElement.classList.remove("is-ended");
  startButton.hidden = false;
  startButton.innerText = "게임 시작";
  document.removeEventListener("keydown", checkInput); // 키 입력 이벤트 제거
  isGameRunning = false; // 게임 실행 상태를 종료로 설정
}

// 페이지 로드 시 초기 설정
function initGame() {
  scoreElement.innerText = 0;
  timerElement.innerText = "20초";
  comboElement.innerText = 0;
  levelElement.innerText = 1;
  targetCharElement.classList.remove("is-warning");
  targetCharElement.innerText = "";
  targetCharElement.hidden = true;
  targetCharElement.classList.remove("is-wrong");
  targetCharElement.classList.remove("is-correct");
  isTargetTransitioning = false;
  gameStatusElement.innerText = "";
  gamePanelElement.classList.remove("is-ended");
  startButton.hidden = false;
}

// 게임 초기화 함수 호출
startButton.addEventListener("click", startGame);
startButton.addEventListener("pointerenter", evadeRestartButton);
initGame();
