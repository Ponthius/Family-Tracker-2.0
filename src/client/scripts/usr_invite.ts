// Get required page elements
const inviteForm = document.getElementById("inviteForm");
const emailInput = document.getElementById("email");
const roleSelect = document.getElementById("role");
const messageDiv = document.getElementById("message");

// Ensure all required elements exist
if (
    !(inviteForm instanceof HTMLFormElement) ||
    !(emailInput instanceof HTMLInputElement) ||
    !(roleSelect instanceof HTMLSelectElement) ||
    !(messageDiv instanceof HTMLDivElement)
) {
    throw new Error("Required page elements were not found.");
}

// Response returned by the backend
interface InvitationResponse {
    message: string;
}

inviteForm.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const role = roleSelect.value;

    // Clear previous message
    messageDiv.textContent = "";
    messageDiv.className = "mt-5 text-center text-sm";

    // Frontend validation
    if (!email || !role) {
        messageDiv.textContent = "Please complete all fields.";
        messageDiv.classList.add("text-red-600");
        return;
    }

    try {
        const response = await fetch("/api/invitations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                role,
            }),
        });

        const data: InvitationResponse = await response.json();

        if (response.ok) {
            messageDiv.textContent = data.message;
            messageDiv.classList.add("text-green-600");

            // Clear the form after a successful invitation
            inviteForm.reset();
        } else {
            messageDiv.textContent = data.message;
            messageDiv.classList.add("text-red-600");
        }
    } catch (error) {
        console.error("Invitation Error:", error);

        messageDiv.textContent =
            "Unable to send invitation. Please try again.";

        messageDiv.classList.add("text-red-600");
    }
});

export {};