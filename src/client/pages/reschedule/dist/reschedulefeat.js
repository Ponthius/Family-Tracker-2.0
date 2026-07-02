"use strict";
// =========================
// Get HTML Elements
// =========================
const modal = document.getElementById("rescheduleModal");
const cancelButton = document.getElementById("cancelReschedule");
const saveButton = document.getElementById("saveReschedule");
const dateInput = document.getElementById("newDate");
const timeInput = document.getElementById("newTime");
const rescheduleButtons = document.querySelectorAll(".rescheduleButton");
// =========================
// Selected Task
// =========================
let selectedTaskId = null;
// =========================
// Open Modal
// =========================
function openReschedule(taskId) {
    selectedTaskId = taskId;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}
// =========================
// Close Modal
// =========================
function closeReschedule() {
    selectedTaskId = null;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    dateInput.value = "";
    timeInput.value = "";
}
// =========================
// Validation
// =========================
function validateInputs() {
    if (!dateInput.value) {
        alert("Please select a date.");
        return false;
    }
    if (!timeInput.value) {
        alert("Please select a time.");
        return false;
    }
    const selectedDateTime = new Date(`${dateInput.value}T${timeInput.value}`);
    if (selectedDateTime < new Date()) {
        alert("You cannot choose a past date.");
        return false;
    }
    return true;
}
// =========================
// Save
// =========================
function saveReschedule() {
    if (!validateInputs()) {
        return;
    }
    console.log("Task ID:", selectedTaskId);
    console.log("New Date:", dateInput.value);
    console.log("New Time:", timeInput.value);
    alert("Task is ready to be rescheduled.");
    closeReschedule();
}
// =========================
// Event Listeners
// =========================
rescheduleButtons.forEach(button => {
    button.addEventListener("click", () => {
        const taskId = Number(button.dataset.taskId);
        openReschedule(taskId);
    });
});
cancelButton.addEventListener("click", closeReschedule);
saveButton.addEventListener("click", saveReschedule);
//# sourceMappingURL=reschedulefeat.js.map