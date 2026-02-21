import "./style.css";
import Alpine from "alpinejs";

Alpine.data("taskApp", () => ({
  tasks: [],
  currentTask: {
    id: null,
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    minDueDate: new Date().toISOString().split("T")[0],
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

  filters: {
    priority: "ALL",
    status: "ALL",
    dueDate: "ALL",
  },

  pagination: {
    page: 1,
    size: 10,
    pages: 1,
    activeButton: "next",
  },

  prevPage() {
    if (this.pagination.page > 1) this.pagination.page--;
    this.pagination.activeButton = "prev";
    this.getTasks();
  },

  nextPage() {
    if (this.pagination.page < this.pagination.pages) this.pagination.page++;
    this.pagination.activeButton = "next";
    this.getTasks();
  },

  computeStyle(button, disabled) {
    if (disabled)
      return "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50";
    return this.pagination.activeButton == button
      ? "bg-black text-white cursor-pointer"
      : "bg-white border-black text-black hover:bg-black hover:text-white cursor-pointer";
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
      minDueDate: new Date().toISOString().split("T")[0],
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
    const params = new URLSearchParams();
    params.append("page", this.pagination.page);
    params.append("size", this.pagination.size);
    if (this.filters.priority !== "ALL")
      params.append("priority", this.filters.priority);
    if (this.filters.status !== "ALL")
      params.append("status", this.filters.status);
    if (this.filters.dueDate !== "ALL")
      params.append("due_date", this.filters.dueDate);
    const queryString = params.toString();
    fetch(`/api/tasks?${queryString}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.tasks = data.items;
        this.pagination.pages = data.pages;
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
    this.currentTask = { ...this.tasks.find((task) => task.id == id) };
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
