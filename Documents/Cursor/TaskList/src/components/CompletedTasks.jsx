import TaskItem from './TaskItem';

const PRIORITIES = ['high', 'medium', 'low'];
const TYPES = ['work', 'personal'];

const CompletedTasks = ({
  tasks,
  isVisible,
  onToggleVisibility,
  onUncomplete,
  onCategoryChange,
  onPriorityChange,
  onUpdateDueDate,
  onDelete,
  onUpdateComments,
  onUpdateTaskText,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onRephrase,
  onUpdateCalendarEventId
}) => {
  // Group tasks by priority and type
  const groupedTasks = PRIORITIES.reduce((acc, priority) => {
    acc[priority] = TYPES.reduce((typeAcc, type) => {
      typeAcc[type] = tasks.filter(task => task.priority === priority && task.type === type);
      return typeAcc;
    }, {});
    return acc;
  }, {});

  const renderPrioritySection = (priority, type) => {
    const sectionTasks = groupedTasks[priority][type];
    if (sectionTasks.length === 0) return null;

    const priorityLabels = { high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority' };
    const typeLabels = { work: 'Work', personal: 'Personal' };

    return (
      <div key={`${priority}-${type}`} className="mb-6">
        <h4 className="text-md font-semibold text-gray-600 mb-2 capitalize">
          Completed - {priorityLabels[priority]} - {typeLabels[type]}
        </h4>
        <div className="space-y-2 pl-4 border-l-2 border-gray-300">
          {sectionTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={onUncomplete}
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
              onUpdateCalendarEventId={onUpdateCalendarEventId}
              isCompleted={true}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8">
      <button
        onClick={onToggleVisibility}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
      >
        <span className={`transform transition-transform ${isVisible ? 'rotate-90' : ''}`}>
          ▶
        </span>
        <span className="font-medium">
          Completed Tasks ({tasks.length})
        </span>
      </button>

      {isVisible && (
        <div className="space-y-6 pl-6 border-l-2 border-gray-200">
          {tasks.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              <p>No completed tasks yet.</p>
            </div>
          ) : (
            PRIORITIES.map(priority =>
              TYPES.map(type => renderPrioritySection(priority, type))
            )
          )}
        </div>
      )}
    </div>
  );
};

export default CompletedTasks;
