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
  showForm: false,

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
    fetch("/api/healthcheck")
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== "healthy")
          throw new Error("Failed to connect to API. Please try again later.");
      })
      .catch((err) => {
        this.notify(
          "Failed to connect to API. Please try again later.",
          "danger",
          360000,
        );
      });
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

  openForm() {
    this.showForm = true;
    this.modalOpened = true;
  },

  closeForm() {
    this.showForm = false;
    this.modalOpened = false;
  },

  openDetail() {
    this.showDetail = true;
    this.modalOpened = true;
  },

  closeDetail() {
    this.showDetail = false;
    this.modalOpened = false;
    this.disapproveAction();
  },

  closeAll() {
    this.modalOpened = false;
    this.showDetail = false;
    this.showForm = false;
    this.disapproveAction();
    this.resetCurrenTask();
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
        this.closeAll();
        this.notify("Task added successfully!", "success");
      })
      .catch((err) => {});
  },

  showTask(id) {
    this.currentTask = this.tasks.find((task) => task.id == id);
    this.currentTask.update = false;
    this.modalButtonText = "Edit";
    this.modalTitle = this.currentTask.title;
    this.openDetail();
  },

  editTask(id) {
    this.closeDetail();
    this.currentTask = { ...this.tasks.find((task) => task.id == id) };
    this.currentTask.update = true;
    this.modalButtonText = "Update";
    this.modalTitle = "Update Task";
    this.openForm();
  },

  newTask() {
    this.closeAll();
    this.resetCurrenTask();
    this.modalButtonText = "Add";
    this.modalTitle = "Add Task";
    this.openForm();
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
        this.closeAll();
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
        this.closeAll();
        this.notify("Task completed successfully!", "success");
      })
      .catch((err) => {});
  },

  deleteTask(id) {
    fetch(`/api/tasks/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        this.tasks = this.tasks.filter((q) => q.id !== id);
        this.closeAll();
        this.notify("Task deleted successfully!", "danger");
      })
      .catch((err) => {
        this.error = err.message;
      });
  },
}));

Alpine.start();
