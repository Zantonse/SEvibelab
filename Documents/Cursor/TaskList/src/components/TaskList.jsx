import { useState } from 'react';
import TaskItem from './TaskItem';

const PRIORITIES = ['high', 'medium', 'low'];
const TYPES = ['work', 'personal'];

const TaskList = ({
  tasks,
  onCompleteTask,
  onCategoryChange,
  onPriorityChange,
  onUpdateDueDate,
  onDelete,
  onReorderTasks,
  onUpdateComments,
  onUpdateTaskText,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onRephrase,
  onUpdateCalendarEventId
}) => {
  const [draggedTask, setDraggedTask] = useState(null);

  // Group tasks by priority and type
  const groupedTasks = PRIORITIES.reduce((acc, priority) => {
    acc[priority] = TYPES.reduce((typeAcc, type) => {
      typeAcc[type] = tasks.filter(task => task.priority === priority && task.type === type);
      return typeAcc;
    }, {});
    return acc;
  }, {});

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, priority, type, isCompleted) => {
    e.preventDefault();
    if (!draggedTask) return;

    // Only allow reordering within the same priority and type section
    if (draggedTask.priority === priority && draggedTask.type === type) {
      const tasksInSection = tasks.filter(task =>
        task.priority === priority && task.type === type && task.completed === isCompleted
      );

      // Find the drop target task
      const dropTarget = e.target.closest('.task-item');
      if (dropTarget) {
        const targetTaskId = dropTarget.getAttribute('data-task-id');
        const targetTask = tasksInSection.find(task => task.id === targetTaskId);

        if (targetTask && targetTask.id !== draggedTask.id) {
          // Determine insert position based on mouse position
          const rect = dropTarget.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const insertAfter = y > rect.height / 2;

          const targetIndex = tasksInSection.findIndex(task => task.id === targetTask.id);
          const newIndex = insertAfter ? targetIndex + 1 : targetIndex;

          if (onReorderTasks) {
            onReorderTasks(draggedTask.id, newIndex, priority, type, isCompleted);
          }
        }
      }
    }

    setDraggedTask(null);
  };

  const renderPrioritySection = (priority, type) => {
    const sectionTasks = groupedTasks[priority][type];
    if (sectionTasks.length === 0) return null;

    const priorityLabels = { high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority' };
    const typeLabels = { work: 'Work', personal: 'Personal' };

    return (
      <div key={`${priority}-${type}`} className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 capitalize">
          {priorityLabels[priority]} - {typeLabels[type]}
        </h3>
        <div className="space-y-2">
          {sectionTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={onCompleteTask}
              onCategoryChange={onCategoryChange}
              onPriorityChange={onPriorityChange}
              onUpdateDueDate={onUpdateDueDate}
              onDelete={onDelete}
              onUpdateComments={onUpdateComments}
              onUpdateTaskText={onUpdateTaskText}
              onAddSubtask={onAddSubtask}
              onUpdateSubtask={onUpdateSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onRephrase={onRephrase}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onUpdateCalendarEventId={onUpdateCalendarEventId}
              isCompleted={false}
            />
          ))}
        </div>
      </div>
    );
  };

  const hasTasks = tasks.length > 0;

  if (!hasTasks) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No active tasks. Add one above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {PRIORITIES.map(priority =>
        TYPES.map(type => renderPrioritySection(priority, type))
      )}
    </div>
  );
};

export default TaskList;
