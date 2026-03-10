document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and dropdown options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants HTML with delete icon
        const participantsList = details.participants.length
          ? `<ul class="participants-list">${details.participants
              .map(
                p =>
                  `<li>${p} <span class="remove" data-email="${p}">&times;</span></li>`
              )
              .join("")}</ul>`
          : `<p class="no-participants"><em>No participants yet.</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <strong>Participants:</strong>
            ${participantsList}
          </div>
        `;

        activityCard.dataset.activity = name;
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle participant removal via icon (event delegation)
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("remove")) {
      const li = event.target.closest("li");
      const email = event.target.dataset.email;
      const card = event.target.closest(".activity-card");
      const activity = card?.dataset.activity;
      if (!activity || !email) return;

      try {
        const res = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(
            email
          )}`,
          { method: "DELETE" }
        );
        const json = await res.json();
        if (res.ok) {
          messageDiv.textContent = json.message;
          messageDiv.className = "success";
          await fetchActivities(); // refresh list
        } else {
          messageDiv.textContent = json.detail || "Failed to remove";
          messageDiv.className = "error";
        }
      } catch (err) {
        messageDiv.textContent = "Failed to remove participant.";
        messageDiv.className = "error";
        console.error(err);
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities(); // refresh to show new participant
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
