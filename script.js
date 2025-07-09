document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginMessage = document.getElementById('login-message');
    const studentEmailDisplay = document.getElementById('student-email-display');
    const busScheduleDiv = document.getElementById('bus-schedule');
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackMessageDisplay = document.getElementById('feedback-message-display');
    const logoutButton = document.getElementById('logout-button');
    const myBusBookingsDiv = document.getElementById('my-bus-bookings');

    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const profileEmailDisplay = document.getElementById('profile-email');

    // Elementos do Modal de Agendamento
    const bookingModal = document.getElementById('booking-modal');
    const modalBusRoute = document.getElementById('modal-bus-route');
    const modalBusTime = document.getElementById('modal-bus-time');
    const modalNucleusSelect = document.getElementById('modal-nucleus-select');
    const modalMapIframe = document.getElementById('modal-map-iframe');
    const modalEmbarkPointDisplay = document.getElementById('modal-embark-point-display');
    const confirmBookingBtn = document.getElementById('confirm-booking-btn');
    const cancelBookingBtn = document.getElementById('cancel-booking-btn');
    const closeModalBtn = document.querySelector('.close-button');

    let siteData = {
        users: [],
        busSchedule: [],
        feedbacks: [],
        embarkationPointsByNucleus: []
    };
    let currentUser = null;
    let currentBusToBook = null;

    const ACADEMIC_EMAIL_DOMAIN = '@unifesspa.edu.br';

    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            siteData = await response.json();
            console.log('Dados carregados:', siteData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    function showSection(targetId) {
        contentSections.forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(targetId).classList.remove('hidden');

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.target === targetId) {
                link.classList.add('active');
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = event.target.dataset.target;
            showSection(targetId);
        });
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await loadData();

        const email = document.getElementById('email').value.toLowerCase();
        const password = document.getElementById('password').value.trim();

        if (!email.endsWith(ACADEMIC_EMAIL_DOMAIN)) {
            loginMessage.textContent = `Por favor, use seu e-mail acadêmico (${ACADEMIC_EMAIL_DOMAIN}).`;
            loginMessage.className = 'message error';
            return;
        }

        currentUser = siteData.users.find(u => u.email === email && u.password === password);

        if (currentUser) {
            loginMessage.textContent = 'Login realizado com sucesso!';
            loginMessage.className = 'message success';
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            studentEmailDisplay.textContent = email;
            profileEmailDisplay.textContent = email;
            renderBusSchedule();
            renderMyBookings();
            populateNucleusSelect();
            showSection('bus-map-content');
        } else {
            loginMessage.textContent = 'E-mail ou senha incorretos. Verifique suas credenciais.';
            loginMessage.className = 'message error';
        }
    });

    function renderBusSchedule() {
        if (siteData.busSchedule.length === 0) {
            busScheduleDiv.innerHTML = '<p>Nenhum horário de ônibus disponível no momento.</p>';
            return;
        }

        const ul = document.createElement('ul');
        siteData.busSchedule.forEach(schedule => {
            schedule.times.forEach(time => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${schedule.route}</strong> - ${time}<br>
                    Dias: ${schedule.days.join(', ')}
                    <button class="book-bus-btn"
                            data-route="${schedule.route}"
                            data-time="${time}"
                            data-days="${schedule.days.join(', ')}">Agendar</button>
                `;
                ul.appendChild(li);
            });
        });
        busScheduleDiv.innerHTML = '';
        busScheduleDiv.appendChild(ul);

        document.querySelectorAll('.book-bus-btn').forEach(button => {
            button.addEventListener('click', openBookingModal);
        });
    }

    function renderMyBookings() {
        const myBookingsList = myBusBookingsDiv.querySelector('ul') || document.createElement('ul');
        myBookingsList.innerHTML = '';

        if (!currentUser || currentUser.bookings.length === 0) {
            myBusBookingsDiv.innerHTML = '<p>Nenhum agendamento ainda.</p>';
            return;
        }

        currentUser.bookings.forEach((booking, index) => { // Adicionado 'index' para identificar o agendamento
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${booking.route}</strong> - ${booking.time}<br>
                Dias: ${booking.days}<br>
                Núcleo de Embarque: <em>${booking.embarkationNucleusName}</em> - Ponto: <em>${booking.embarkationPointName}</em><br>
                <em>Agendado em: ${booking.timestamp}</em>
                <button class="remove-booking-btn" data-index="${index}">Remover</button>
            `;
            myBookingsList.appendChild(li);
        });
        myBusBookingsDiv.innerHTML = '';
        myBusBookingsDiv.appendChild(myBookingsList);

        // Adiciona event listeners aos novos botões de remover
        document.querySelectorAll('.remove-booking-btn').forEach(button => {
            button.addEventListener('click', handleRemoveBooking);
        });
    }

    // NOVA FUNÇÃO: Lidar com a remoção de agendamento
    function handleRemoveBooking(event) {
        if (!currentUser) {
            alert('Erro: Usuário não logado.');
            return;
        }

        const indexToRemove = parseInt(event.target.dataset.index); // Pega o índice do agendamento a ser removido

        if (confirm('Tem certeza que deseja remover este agendamento?')) {
            currentUser.bookings.splice(indexToRemove, 1); // Remove o agendamento pelo índice
            renderMyBookings(); // Re-renderiza a lista
            alert('Agendamento removido com sucesso!');
            console.log('Agendamento removido. Agendamentos restantes:', currentUser.bookings);
        }
    }


    function populateNucleusSelect() {
        modalNucleusSelect.innerHTML = '';
        if (siteData.embarkationPointsByNucleus && siteData.embarkationPointsByNucleus.length > 0) {
            siteData.embarkationPointsByNucleus.forEach(point => {
                const option = document.createElement('option');
                option.value = point.id;
                option.textContent = point.name;
                modalNucleusSelect.appendChild(option);
            });
            updateModalMapAndPoint();
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum núcleo disponível';
            modalNucleusSelect.appendChild(option);
            modalNucleusSelect.disabled = true;
        }
    }

    function updateModalMapAndPoint() {
        const selectedNucleusId = modalNucleusSelect.value;
        const selectedNucleus = siteData.embarkationPointsByNucleus.find(n => n.id === selectedNucleusId);

        if (selectedNucleus) {
            modalMapIframe.src = selectedNucleus.mapEmbedUrl;
            modalEmbarkPointDisplay.textContent = `Ponto de Embarque: ${selectedNucleus.pointName}`;
            modalEmbarkPointDisplay.className = 'message info';
        } else {
            modalMapIframe.src = '';
            modalEmbarkPointDisplay.textContent = 'Selecione um núcleo para ver o ponto de embarque.';
            modalEmbarkPointDisplay.className = 'message';
        }
    }

    modalNucleusSelect.addEventListener('change', updateModalMapAndPoint);

    function openBookingModal(event) {
        if (!currentUser) {
            alert('Você precisa estar logado para agendar um ônibus.');
            return;
        }

        const button = event.target;
        currentBusToBook = {
            route: button.dataset.route,
            time: button.dataset.time,
            days: button.dataset.days
        };

        modalBusRoute.textContent = currentBusToBook.route;
        modalBusTime.textContent = currentBusToBook.time;

        populateNucleusSelect();
        updateModalMapAndPoint();

        bookingModal.classList.remove('hidden');
    }

    confirmBookingBtn.addEventListener('click', () => {
        const selectedNucleusId = modalNucleusSelect.value;
        const selectedNucleus = siteData.embarkationPointsByNucleus.find(n => n.id === selectedNucleusId);

        if (!selectedNucleus) {
            alert('Por favor, selecione um núcleo de embarque válido.');
            return;
        }

        const booking = {
            route: currentBusToBook.route,
            time: currentBusToBook.time,
            days: currentBusToBook.days,
            embarkationNucleusId: selectedNucleus.id,
            embarkationNucleusName: selectedNucleus.name,
            embarkationPointName: selectedNucleus.pointName,
            timestamp: new Date().toLocaleString()
        };

        currentUser.bookings.push(booking);
        alert(`Agendamento confirmado para ${booking.route} às ${booking.time}, ponto: ${booking.embarkationPointName}`);
        console.log('Novo agendamento:', booking);
        console.log('Agendamentos do usuário:', currentUser.bookings);

        renderMyBookings();
        closeBookingModal();
    });

    function closeBookingModal() {
        bookingModal.classList.add('hidden');
        currentBusToBook = null;
    }

    cancelBookingBtn.addEventListener('click', closeBookingModal);
    closeModalBtn.addEventListener('click', closeBookingModal);

    window.addEventListener('click', (event) => {
        if (event.target === bookingModal) {
            closeBookingModal();
        }
    });

    feedbackForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const feedbackType = document.getElementById('feedback-type').value;
        const feedbackMessage = document.getElementById('feedback-message').value;
        const studentEmail = studentEmailDisplay.textContent;

        if (feedbackMessage.trim() === '') {
            feedbackMessageDisplay.textContent = 'Por favor, digite sua mensagem de feedback.';
            feedbackMessageDisplay.className = 'message error';
            return;
        }

        const newFeedback = {
            email: studentEmail,
            type: feedbackType,
            message: feedbackMessage,
            timestamp: new Date().toLocaleString()
        };

        siteData.feedbacks.push(newFeedback);
        console.log('Novo Feedback:', newFeedback);
        console.log('Todos os Feedbacks:', siteData.feedbacks);

        feedbackMessageDisplay.textContent = 'Feedback enviado com sucesso! Agradecemos sua contribuição.';
        feedbackMessageDisplay.className = 'message success';
        feedbackForm.reset();
    });

    logoutButton.addEventListener('click', () => {
        dashboardSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        loginForm.reset();
        loginMessage.textContent = '';
        feedbackMessageDisplay.textContent = '';
        currentUser = null;
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector('.nav-link[data-target="bus-map-content"]').classList.add('active');
        closeBookingModal();
    });

    loadData();
});