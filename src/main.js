import "./style.css";
import Alpine from "alpinejs";

Alpine.data("taskApp", () => ({
  tasks: [],
  currentTask: {
    id: null,
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    priority: "LOW",
    update: false,
  },
  error: null,
  modalButtonText: "Add",
  modalOpened: false,
  modalTitle: "Add Task",
  showDetail: false,

  targetedTask: {
    id: null,
    action: "",
  },

  copyright: `©️ bitnoises.com - ${new Date().getFullYear()}`,

  notification: {
    show: false,
    message: "",
    type: "info",
  },

  init() {
    this.getTasks();
  },

  toggleModal() {
    this.modalOpened = !this.modalOpened;
  },

  resetCurrenTask() {
    this.currentTask = {
      id: null,
      title: "",
      description: "",
      dueDate: new Date().toISOString().split("T")[0],
      priority: "LOW",
      update: false,
    };
  },

  handleSubmit() {
    const payload = {
      title: this.currentTask.title,
      description: this.currentTask.description,
      dueDate: this.currentTask.dueDate,
      priority: this.currentTask.priority,
    };

    if (this.currentTask.update) this.updateTask(this.currentTask.id, payload);
    else this.addTask(payload);
  },

  notify(message, type = "info", duration = 3000) {
    this.notification.message = message;
    this.notification.type = type;
    this.notification.show = true;

    setTimeout(() => {
      this.notification.show = false;
    }, duration);
  },

  approveAction() {
    if (this.targetedTask.action === "Delete")
      this.deleteTask(this.targetedTask.id);
    else if (this.targetedTask.action === "Complete")
      this.completeTask(this.targetedTask.id);
    this.targetedTask = { id: null, action: "" };
  },

  disapproveAction() {
    this.targetedTask = { id: null, action: "" };
  },

  getTasks() {
    fetch(`/api/tasks`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.tasks = data;
      })
      .catch((err) => {
        this.error = err.message;
      });
  },

  addTask(payload) {
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.tasks = [data, ...this.tasks];
        this.toggleModal();
        this.resetCurrenTask();
        this.notify("Task added successfully!", "success");
      })
      .catch((err) => {});
  },

  showTask(id) {
    this.currentTask = this.tasks.find((task) => task.id == id);
    this.currentTask.update = false;
    this.showDetail = true;
    this.modalOpened = true;
    this.modalButtonText = "Edit";
    this.modalTitle = this.currentTask.title;
  },

  editTask(id) {
    this.currentTask = this.tasks.find((task) => task.id == id);
    this.currentTask.update = true;
    this.modalOpened = true;
    this.modalButtonText = "Update";
    this.modalTitle = "Update Task";
  },

  updateTask(id, payload) {
    fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.tasks = this.tasks.map((task) => (task.id == id ? data : task));
        this.toggleModal();
        this.resetCurrenTask();
        this.notify("Task updated successfully!", "info");
      })
      .catch((err) => {});
  },

  completeTask(id) {
    fetch(`/api/tasks/${id}`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.tasks = this.tasks.map((task) => (task.id == id ? data : task));
        this.resetCurrenTask();
        this.notify("Task completed successfully!", "success");
      })
      .catch((err) => {});
  },

  deleteTask(id) {
    fetch(`/api/tasks/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        this.tasks = this.tasks.filter((q) => q.id !== id);
        this.resetCurrenTask();
        this.notify("Task deleted successfully!", "danger");
      })
      .catch((err) => {
        this.error = err.message;
      });
  },
}));

Alpine.start();
