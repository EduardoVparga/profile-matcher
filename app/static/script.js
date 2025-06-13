document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const suggestionsDropdown = document.getElementById('suggestionsDropdown');
    const searchBar = document.querySelector('.search-bar'); // Referencia a la barra completa

    // Datos de ejemplo (simulando una respuesta de búsqueda)
    const peopleData = [
        { name: 'Eduardo Valenzuela Parga', description: 'Problem solver', avatar: 'img/eduardo1.jpg', checked: false },
        { name: 'Luis Eduardo Brochet Fernandez', description: 'Analyst', avatar: 'img/luis.jpg', checked: true },
        { name: 'Eduardo Uribe Mejia', description: 'International business negotiator', avatar: 'img/eduardo2.jpg', checked: true },
        { name: 'Eduardo Castro', description: 'Director', avatar: 'E', checked: false }, // Avatar de letra
        { name: 'Carlos Eduardo Beltran Molina', description: 'Ops Engineer', avatar: 'C', checked: true }, // Avatar de letra
        { name: 'Carlos Eduardo Rodriguez Lozano', description: 'CTO at Instaleop', avatar: 'C', checked: true }, // Avatar de letra
         { name: 'Ana Maria Perez', description: 'Marketing Specialist', avatar: 'A', checked: false },
         { name: 'Juan Pablo Gomez', description: 'Software Developer', avatar: 'J', checked: true },
         { name: 'Sofia Carolina Diaz', description: 'Project Manager', avatar: 'S', checked: false },
    ];

    // Función para renderizar las sugerencias
    function renderSuggestions(filterText = '') {
        suggestionsDropdown.innerHTML = ''; // Limpiar sugerencias anteriores
        const lowerCaseFilterText = filterText.toLowerCase();

        const filteredPeople = peopleData.filter(person =>
            person.name.toLowerCase().includes(lowerCaseFilterText) // Simple filtro por nombre
        );

        if (filteredPeople.length === 0 && filterText.length > 0) {
             // Opcional: Mostrar un mensaje si no hay resultados
             const noResultsItem = document.createElement('li');
             noResultsItem.classList.add('suggestion-item');
             noResultsItem.style.justifyContent = 'center';
             noResultsItem.style.fontStyle = 'italic';
             noResultsItem.style.color = '#a0a0a0';
             noResultsItem.textContent = 'No results found';
             suggestionsDropdown.appendChild(noResultsItem);
        } else {
            filteredPeople.forEach(person => {
                const listItem = document.createElement('li');
                listItem.classList.add('suggestion-item');

                // Crear el avatar
                const avatarDiv = document.createElement('div');
                avatarDiv.classList.add('avatar');
                if (person.avatar.length === 1) { // Es una letra
                    avatarDiv.classList.add('letter');
                    avatarDiv.textContent = person.avatar;
                } else if (person.avatar.startsWith('img/')) { // Es una ruta de imagen
                    const img = document.createElement('img');
                    img.src = person.avatar;
                    img.alt = person.name;
                    avatarDiv.appendChild(img);
                } else { // Avatar por defecto (icono)
                     const icon = document.createElement('i');
                     icon.classList.add('fas', 'fa-user'); // Icono de usuario por defecto
                     avatarDiv.appendChild(icon);
                }
                listItem.appendChild(avatarDiv);

                // Crear el contenido de texto (Nombre y descripción)
                const textContentDiv = document.createElement('div');
                textContentDiv.classList.add('text-content');

                const nameDiv = document.createElement('div');
                nameDiv.classList.add('name');
                // Aquí puedes formatear "Person: Nombre Apellido"
                const personLabel = document.createElement('span');
                personLabel.textContent = 'Person: ';
                const strongName = document.createElement('strong');
                strongName.textContent = person.name; // El nombre completo
                nameDiv.appendChild(personLabel);
                nameDiv.appendChild(strongName);


                const descriptionDiv = document.createElement('div');
                descriptionDiv.classList.add('description');
                descriptionDiv.textContent = person.description;

                textContentDiv.appendChild(nameDiv);
                textContentDiv.appendChild(descriptionDiv);
                listItem.appendChild(textContentDiv);

                // Añadir el checkmark si está marcado
                if (person.checked) {
                    const checkIcon = document.createElement('i');
                    checkIcon.classList.add('fas', 'fa-check-circle', 'checked');
                    listItem.appendChild(checkIcon);
                }

                suggestionsDropdown.appendChild(listItem);
            });
        }


    }

    // Evento al escribir en el input
    searchInput.addEventListener('input', () => {
        const filterText = searchInput.value.trim(); // Obtener el valor y quitar espacios al inicio/final

        if (filterText.length > 0) {
            renderSuggestions(filterText); // Renderizar sugerencias (puedes pasar el texto para filtrar)
            suggestionsDropdown.style.display = 'block'; // Mostrar el dropdown
        } else {
            suggestionsDropdown.style.display = 'none'; // Ocultar si el input está vacío
            suggestionsDropdown.innerHTML = ''; // Limpiar el contenido
        }
    });

    // Evento al enfocar el input (para la línea amarilla)
    searchInput.addEventListener('focus', () => {
        searchBar.classList.add('focused');
        // Si el input tiene contenido al enfocar, mostrar el dropdown
        if (searchInput.value.trim().length > 0) {
             renderSuggestions(searchInput.value.trim());
             suggestionsDropdown.style.display = 'block';
        }
    });

    // Evento al perder el foco del input (para la línea amarilla y ocultar dropdown)
    searchInput.addEventListener('blur', () => {
        searchBar.classList.remove('focused');

        // Pequeño retraso para permitir clicks en las sugerencias antes de ocultar
        setTimeout(() => {
            // Comprobar si el foco se ha movido a un elemento dentro del dropdown (opcional, más complejo)
            // Para este ejemplo simple, simplemente lo ocultamos
             suggestionsDropdown.style.display = 'none';
        }, 100); // Ajusta el tiempo si es necesario

    });

    // Opcional: Manejar click en una sugerencia (ejemplo: pone el nombre en el input)
    suggestionsDropdown.addEventListener('click', (event) => {
        const item = event.target.closest('.suggestion-item'); // Encuentra el item más cercano
        if (item) {
            // Encuentra el nombre dentro del item cliqueado
            const nameElement = item.querySelector('.text-content .name strong');
            if (nameElement) {
                searchInput.value = nameElement.textContent; // Pone el nombre en el input
                suggestionsDropdown.style.display = 'none'; // Oculta el dropdown
                 // Opcional: Aquí podrías simular una búsqueda o navegación
                 console.log('Seleccionado:', searchInput.value);
            }
        }
    });

    // Inicialmente ocultar el dropdown
    suggestionsDropdown.style.display = 'none';

});