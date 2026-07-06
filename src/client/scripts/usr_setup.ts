// Get required page elements
const inviteForm = document.getElementById("inviteForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const messageDiv = document.getElementById("message");
const familyNameDiv = document.getElementById("familyName");

// Ensure all required elements exist
if (
    !(inviteForm instanceof HTMLFormElement) ||
    !(usernameInput instanceof HTMLInputElement) ||
    !(passwordInput instanceof HTMLInputElement) ||
    !(confirmPasswordInput instanceof HTMLInputElement) ||
    !(messageDiv instanceof HTMLDivElement) ||
    !(familyNameDiv instanceof HTMLDivElement)
) {
    throw new Error("Required page elements were not found.");
}

// Get the invitation token from the URL
const token = window.location.pathname.split("/").pop();

interface AcceptInvitationResponse {
    message: string;
    familyName?: string;
}

inviteForm.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Clear previous message
    messageDiv.textContent = "";
    messageDiv.className = "mt-5 text-center text-sm";

    // Validate form
    if (!username || !password || !confirmPassword) {
        messageDiv.textContent = "Please complete all fields.";
        messageDiv.classList.add("text-red-600");
        return;
    }

    if (password !== confirmPassword) {
        messageDiv.textContent = "Passwords do not match.";
        messageDiv.classList.add("text-red-600");
        return;
    }

    try {
        const response = await fetch("/api/invitations/accept", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token,
                username,
                password,
            }),
        });

        const data: AcceptInvitationResponse = await response.json();

        if (response.ok) {
            messageDiv.textContent = data.message;
            messageDiv.classList.add("text-green-600");

            // Display family name if the backend returns it
            if (data.familyName) {
                familyNameDiv.textContent = `Family: ${data.familyName}`;
            }

            // Reset the form
            inviteForm.reset();

            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1500);

        } else {
            messageDiv.textContent = data.message;
            messageDiv.classList.add("text-red-600");
        }

    } catch (error) {
        console.error("Invitation Setup Error:", error);

        messageDiv.textContent =
            "Something went wrong. Please try again.";

        messageDiv.classList.add("text-red-600");
    }
});

export {};