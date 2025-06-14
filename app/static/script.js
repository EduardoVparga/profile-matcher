
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const suggestionsDropdown = document.getElementById('suggestionsDropdown');
    const searchBar = document.querySelector('.search-bar');
    const modalOverlay = document.getElementById('modalOverlay');
    const profileModal = document.getElementById('profileModal');
    const modalContent = document.getElementById('modalContent');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    
    let debounceTimer;

    function renderSuggestions(peopleData = []) {
        suggestionsDropdown.innerHTML = ''; 

        if (peopleData.length === 0 && searchInput.value.trim().length > 0) {
             const noResultsItem = document.createElement('li');
             noResultsItem.classList.add('suggestion-item');
             noResultsItem.style.justifyContent = 'center';
             noResultsItem.textContent = 'No results found';
             suggestionsDropdown.appendChild(noResultsItem);
        } else {
            peopleData.forEach(person => {
                if (!person.publicId) return;

                const listItem = document.createElement('li');
                listItem.classList.add('suggestion-item');
                listItem.dataset.publicid = person.publicId;

                const avatarDiv = document.createElement('div');
                avatarDiv.classList.add('avatar');
                if (person.avatar && person.avatar.startsWith('http')) {
                    const img = document.createElement('img');
                    img.src = person.avatar;
                    img.alt = person.name;
                    avatarDiv.appendChild(img);
                } else { 
                     const icon = document.createElement('i');
                     icon.classList.add('fas', 'fa-user');
                     avatarDiv.appendChild(icon);
                }
                listItem.appendChild(avatarDiv);
                
                const textContentDiv = document.createElement('div');
                textContentDiv.classList.add('text-content');
                const nameDiv = document.createElement('div');
                nameDiv.classList.add('name');
                const strongName = document.createElement('strong');
                strongName.textContent = person.name;
                nameDiv.appendChild(strongName);
                const descriptionDiv = document.createElement('div');
                descriptionDiv.classList.add('description');
                descriptionDiv.textContent = person.description;
                textContentDiv.appendChild(nameDiv);
                textContentDiv.appendChild(descriptionDiv);
                listItem.appendChild(textContentDiv);
                
                if (person.checked) {
                    const checkIcon = document.createElement('i');
                    checkIcon.classList.add('fas', 'fa-check-circle', 'checked');
                    listItem.appendChild(checkIcon);
                }

                suggestionsDropdown.appendChild(listItem);
            });
        }
    }

    function renderModalContent(data) {
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>${data.name || 'Unknown'}</h2>
                ${data.remoter ? '<span class="remoter-badge">Remoter</span>' : ''}
            </div>
            <div class="modal-body">
                <p>${data.summary_of_bio || 'No summary available.'}</p>

                <h3 class="modal-section-title">Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="value">${data.stats_strengths}</div>
                        <div class="label">Strengths</div>
                    </div>
                    <div class="stat-item">
                        <div class="value">${data.stats_jobs}</div>
                        <div class="label">Jobs</div>
                    </div>
                    <div class="stat-item">
                        <div class="value">${data.stats_education}</div>
                        <div class="label">Education</div>
                    </div>
                </div>

                <h3 class="modal-section-title">Top Strength</h3>
                ${data.top_strength_name ? `
                    <div class="strength-highlight">
                        <div class="name">${data.top_strength_name}</div>
                        <div class="proficiency">${data.top_strength_proficiency.replace('-', ' ')}</div>
                    </div>
                ` : '<p>No strengths listed.</p>'}

                <h3 class="modal-section-title">Last Job</h3>
                <p><strong>Period:</strong> ${data.last_job_period || 'N/A'}</p>
                <p><strong>Location:</strong> ${data.location || 'N/A'}</p>
            </div>
        `;
    }

    // Función para abrir y cargar los datos del modal
    async function openProfileModal(username) {
        modalOverlay.classList.add('show');
        profileModal.classList.add('show');
        modalContent.innerHTML = '<div class="loader"></div>'; 

        try {
            const response = await fetch(`/api/person/${username}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to load profile.');
            }
            const profileData = await response.json();
            renderModalContent(profileData);
        } catch (error) {
            modalContent.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Error: ${error.message}</p>`;
            console.error('Error fetching profile details:', error);
        }
    }

    function closeProfileModal() {
        modalOverlay.classList.remove('show');
        profileModal.classList.remove('show');
        setTimeout(() => {
            modalContent.innerHTML = '';
        }, 300); 
    }

    const search = async (query) => {
        if (query.length === 0) {
            suggestionsDropdown.style.display = 'none';
            return;
        }
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query }),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            
            const peopleData = await response.json();
            renderSuggestions(peopleData);
            suggestionsDropdown.style.display = 'block';
        } catch (error) {
            console.error('Error fetching search results:', error);
            suggestionsDropdown.innerHTML = '<li class="suggestion-item" style="color: #ff6b6b;">Error loading results</li>';
            suggestionsDropdown.style.display = 'block';
        }
    };


    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        clearTimeout(debounceTimer);
        if (query.length === 0) {
            suggestionsDropdown.style.display = 'none';
            return;
        }
        debounceTimer = setTimeout(() => search(query), 200);
    });

    suggestionsDropdown.addEventListener('click', (event) => {
        const item = event.target.closest('.suggestion-item');
        if (item && item.dataset.publicid) {
            const username = item.dataset.publicid;
            openProfileModal(username);
            searchInput.value = '';
            suggestionsDropdown.style.display = 'none';
        }
    });

    modalCloseBtn.addEventListener('click', closeProfileModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) { 
            closeProfileModal();
        }
    });

    searchInput.addEventListener('focus', () => {
        searchBar.classList.add('focused');
        if (searchInput.value.trim().length > 0) {
            search(searchInput.value.trim());
        }
    });

    searchInput.addEventListener('blur', () => {
        searchBar.classList.remove('focused');
        setTimeout(() => {
            if (!modalOverlay.classList.contains('show')) {
                 suggestionsDropdown.style.display = 'none';
            }
        }, 200);
    });
    
    suggestionsDropdown.style.display = 'none';
});