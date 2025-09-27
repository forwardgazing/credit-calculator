// Временная проверка синтаксиса
console.log ("Скрипт загружен"); // Если это выполняется, синтаксис в порядке до этой точки
// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Элементы формы
    const loanAmountInput = document.getElementById('loanAmount');
    const loanAmountRange = document.getElementById('loanAmountRange');
    const loanTermInput = document.getElementById('loanTerm');
    const loanTermRange = document.getElementById('loanTermRange');
    const interestRateInput = document.getElementById('interestRate');
    const interestRateRange = document.getElementById('interestRateRange');
    const calculateBtn = document.getElementById('calculateBtn');
    
    // Элементы результатов
    const monthlyPaymentEl = document.getElementById('monthlyPayment');
    const totalPaymentEl = document.getElementById('totalPayment');
    const overpaymentEl = document.getElementById('overpayment');
    const paymentTableBody = document.getElementById('paymentTableBody');
    
    // График
    let paymentChart = null;
    
    // Синхронизация полей ввода и ползунков
    function syncInputAndRange(input, range) {
        input.addEventListener('input', function() {
            range.value = this.value;
        });
        
        range.addEventListener('input', function() {
            input.value = this.value;
        });
    }
    
    // Инициализация синхронизации
    syncInputAndRange(loanAmountInput, loanAmountRange);
    syncInputAndRange(loanTermInput, loanTermRange);
    syncInputAndRange(interestRateInput, interestRateRange);
    
    // Форматирование чисел в денежный формат
    function formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    }
    
    // Расчет аннуитетного платежа
    function calculateAnnuityPayment(loanAmount, annualRate, years) {
        const months = years * 12;
        const monthlyRate = annualRate / 100 / 12;
        
        // Формула аннуитетного платежа
        const annuityCoefficient = monthlyRate * Math.pow(1 + monthlyRate, months) / 
                                  (Math.pow(1 + monthlyRate, months) - 1);
        
        return loanAmount * annuityCoefficient;
    }
    
    // Генерация графика платежей
    function generatePaymentSchedule(loanAmount, annualRate, years, monthlyPayment) {
        const schedule = [];
        let remainingDebt = loanAmount;
        const monthlyRate = annualRate / 100 / 12;
        const months = years * 12;
        
        for (let month = 1; month <= months; month++) {
            const interestPayment = remainingDebt * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            const totalPayment = principalPayment + interestPayment;
            
            schedule.push({
                month: month,
                remainingDebt: remainingDebt,
                principalPayment: principalPayment,
                interestPayment: interestPayment,
                totalPayment: totalPayment
            });
            
            remainingDebt -= principalPayment;
            if (remainingDebt < 0) remainingDebt = 0;
        }
        
        return schedule;
    }
    
    // Обновление таблицы платежей
    function updatePaymentTable(schedule) {
        paymentTableBody.innerHTML = '';
        
        schedule.forEach((payment, index) => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.style.animationDelay = (index * 0.05) + 's';
            
            // Создаем ячейки через DOM методы вместо innerHTML
            const monthCell = document.createElement('td');
            monthCell.textContent = payment.month;
            
            const remainingDebtCell = document.createElement('td');
            remainingDebtCell.textContent = formatCurrency(payment.remainingDebt);
            
            const principalPaymentCell = document.createElement('td');
            principalPaymentCell.textContent = formatCurrency(payment.principalPayment);
            const interestPaymentCell = document.createElement('td');
            interestPaymentCell.textContent = formatCurrency(payment.interestPayment);
            
            const totalPaymentCell = document.createElement('td');
            totalPaymentCell.textContent = formatCurrency(payment.totalPayment);
            
            // Добавляем ячейки в строку
            row.appendChild(monthCell);
            row.appendChild(remainingDebtCell);
            row.appendChild(principalPaymentCell);
            row.appendChild(interestPaymentCell);
            row.appendChild(totalPaymentCell);
            
            paymentTableBody.appendChild(row);
        });
    }
    
    // Создание графика
    function createChart(schedule) {
        const ctx = document.getElementById('paymentChart').getContext('2d');
        
        // Данные для графика (первые 12 месяцев для наглядности)
        const displayMonths = Math.min(12, schedule.length);
        const labels = schedule.slice(0, displayMonths).map(p => 'Месяц ' + p.month);
        const principalData = schedule.slice(0, displayMonths).map(p => p.principalPayment);
        const interestData = schedule.slice(0, displayMonths).map(p => p.interestPayment);
        
        if (paymentChart) {
            paymentChart.destroy();
        }
        
        paymentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Основной долг',
                        data: principalData,
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Проценты',
                        data: interestData,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += formatCurrency(context.raw);
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Анимация карточек с результатами
    function animateSummaryCards() {
        document.querySelectorAll('.summary-card').forEach((card, index) => {
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = 'slideInUp 0.6s ease ' + (index * 0.1) + 's both';
            }, 10);
        });
    }
    
    // Основная функция расчета
    function calculatePayments() {
        // Показываем индикатор загрузки
        calculateBtn.classList.add('loading');
        
        // Имитация загрузки для анимации
        setTimeout(() => {
            try {
                const loanAmount = parseFloat(loanAmountInput.value);
                const loanTerm = parseFloat(loanTermInput.value);
                const interestRate = parseFloat(interestRateInput.value);
                
               //Валидация - ИСПРАВЛЕННАЯ ВЕРСИЯ
                if (isNaN(loanAmount)||  isNaN(loanTerm)||  isNaN(interestRate) ||
                    loanAmount <= 0  || loanTerm <= 0  || interestRate <= 0) {
                    throw new Error('Пожалуйста, введите корректные значения');
                }
                
                // Расчет
                const monthlyPayment = calculateAnnuityPayment(loanAmount, interestRate, loanTerm);
                const totalPayment = monthlyPayment * (loanTerm * 12);
                const overpayment = totalPayment - loanAmount;
                
                // Обновление результатов
                monthlyPaymentEl.textContent = formatCurrency(monthlyPayment);
                totalPaymentEl.textContent = formatCurrency(totalPayment);
                overpaymentEl.textContent = formatCurrency(overpayment);
                
                // Генерация графика платежей
                const schedule = generatePaymentSchedule(loanAmount, interestRate, loanTerm, monthlyPayment);
                
                // Обновление таблицы
                updatePaymentTable(schedule);
                
                // Создание графика
                createChart(schedule);
                
                // Анимация карточек с результатами
                animateSummaryCards();
                
            } catch (error) {
                alert(error.message);
            } finally {
                // Скрываем индикатор загрузки
                calculateBtn.classList.remove('loading');
            }
        }, 800);
    }
    
    // Обработчик кнопки расчета
    calculateBtn.addEventListener('click', calculatePayments);
    
    // Автоматический расчет при изменении полей ввода
    [loanAmountInput, loanTermInput, interestRateInput].forEach(input => {
        input.addEventListener('input', calculatePayments);
    });
    
    // Первоначальный расчет
    calculatePayments();
});