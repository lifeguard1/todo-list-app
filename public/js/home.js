$(document).ready(function () {
    const todo = $('.box-child-todo');
    const doing = $('.box-child-doing');
    const done = $('.box-child-done');
    const boxList = $('.box-list');
    const addButton = $('.plus');

    // Client-side cached data 
    let tasksCache = {
        todo: [],
        doing: [],
        done: []
    };

    function hideOtherBoxes(activeBox) {
        $('.box-child').not(activeBox).css('display', 'none');
        boxList.css('display', 'block');
    }

    function showAllBoxes() {
        $('.box-child').css('display', 'flex');
        boxList.empty();
        boxList.css('display', 'none');
    }

    function toggleBox(activeBox, category) {
        if (activeBox.hasClass('active')) {
            activeBox.removeClass('active');
            activeBox.css('transition', 'transform 1s ease');
            showAllBoxes();
            addButton.css('display', 'none');
        } else {
            activeBox.addClass('active');
            activeBox.css('transition', 'transform 1s ease');
            hideOtherBoxes(activeBox);
            addButton.css('display', 'flex');
            displayTasks(category); // Function for loading all boxes from cache
        }
    }

    // Fetch tasks from server
    function fetchTasks() {
        const categories = ['todo', 'doing', 'done'];
    
        categories.forEach(category => {
            fetch(`/api/tasks?category=${category}`, {
                method: 'GET',
                headers: {
                    'x-access-token': localStorage.getItem('token')
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load tasks');
                }
                return response.json();
            })
            .then(data => {
                console.log(`Fetched tasks for ${category}:`, data); // Log the fetched tasks
                tasksCache[category] = data.tasks;
                updateTaskcount(category); // Update the task count when tasks are fetched
            })
            .catch(err => {
                console.error('Error loading tasks:', err.message);
            });
        });
    }

    // Display loaded tasks from cache
    function displayTasks(category) {
        boxList.empty();
        tasksCache[category].forEach(task => {
            createBox(task.content, task.id, category);
        });
    }

    function updateTaskcount(category) {
        const count = tasksCache[category].length;
        console.log(`Updating task count for ${category}: ${count}`); // Debugging statement
        $(`.${category}-count`).text(count);
        console.log(`Updated task count for ${category}: ${count}`); // Confirm the count update
    }

    todo.click(function () {
        toggleBox(todo, 'todo');
    });

    doing.click(function () {
        toggleBox(doing, 'doing');
    });

    done.click(function () {
        toggleBox(done, 'done');
    });

    addButton.click(function () {
        const activeCategory = $('.box-child.active').data('category');
        createBox('', null, activeCategory);
    });

    function createBox(content, taskId, category) {
        const container = $('<div>', { class: 'task-container' });
        const textArea = $('<textarea>', {
            class: 'box',
            placeholder: 'Write something...',
            readonly: true,
            text: content,
            'data-task-id': taskId || '',
            'data-category': category || ''
        });
        const deleteButton = $('<img>', { 
            class: 'delete', 
            src: '/images/delete.png', // Replace with the path to your delete icon
            alt: 'Delete'
        });

        container.append(textArea, deleteButton);
        boxList.append(container);

        return container;
    }

    // Event Delegation for Editing Task
    $(document).on('click', '.box', function () {
        $(this).prop('readonly', false);
    });

    $(document).on('keydown', '.box', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = $(this).val().trim();
            if (text !== "") {
                $(this).prop('readonly', true);
                $(this).blur();
                const currentTaskId = $(this).data('task-id'); // Access task id using data
                if (currentTaskId) {
                    updateTask(currentTaskId, text); // Update existing task
                } else {
                    addTask($(this), text); // Add new task
                }
            }
        }
    });

    // Event Delegation for Deleting Task
    $(document).on('click', '.delete', function () {
        const taskContainer = $(this).closest('.task-container'); // Get the nearest task container
        const textArea = taskContainer.find('textarea');
        const taskId = textArea.data('task-id'); // Access task id using data
        const category = textArea.attr('data-category'); // Get the category on the textarea
        console.log('Delete button clicked for task ID:', taskId, 'Category:', category); // Debugging statement
        if (taskId && category) {
            deleteTask(taskId, taskContainer, category);
        }
    });

    function addTask(textArea, content) {
        const category = textArea.attr('data-category');
        fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'x-access-token': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ category: category, content: content })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add task');
            }
            return response.json();
        })
        .then(data => {
            console.log('Task added successfully:', data);
            tasksCache[category].push({ content: content, id: data.taskId }); // Add task to cache
            updateTaskcount(category); // Update the count
            textArea.attr('data-task-id', data.taskId); // Set the task id on the textarea
            textArea.data('task-id', data.taskId); // Ensure the task ID is set
            console.log('Assigned task ID:', data.taskId, 'to new task');
            console.log('TextArea data-task-id after setting:', textArea.data('task-id')); // Log the task ID
        })
        .catch(err => {
            console.error('Error adding task:', err.message);
        });
    }

    function updateTask(taskId, content) {
        const category = $(`textarea[data-task-id=${taskId}]`).attr('data-category');
        fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'x-access-token': localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: content })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update task');
            }
            return response.json();
        })
        .then(data => {
            console.log('Task updated successfully:', data);
            // Update the content in the cache
            const task = tasksCache[category].find(t => t.id === taskId);
            if (task) {
                task.content = content;
                console.log('Updated task in cache:', task);
            }
        })
        .catch(err => {
            console.error('Error updating task:', err.message);
        });
    }

    function deleteTask(taskId, taskContainer, category) {
        console.log('Deleting task ID:', taskId, 'from category:', category); // Debugging statement

        fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'x-access-token': localStorage.getItem('token'),
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete task');
            }
            return response.json();
        })
        .then(data => {
            console.log('Task deleted successfully:', data);
            // Remove task from the cache
            tasksCache[category] = tasksCache[category].filter(t => t.id !== taskId);
            updateTaskcount(category); // Update the count
            console.log('Updated cache for category', category, ':', tasksCache[category]);
            taskContainer.remove(); // Remove the task container from the DOM
        })
        .catch(err => {
            console.error('Error deleting task:', err.message);
        });
    }

    // Fetch all tasks on page load
    fetchTasks();
});
