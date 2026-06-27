from rest_framework import viewsets
from .models import Project, Task, TaskComment
from .serializers import ProjectSerializer, TaskSerializer, TaskCommentSerializer
from rest_framework.permissions import IsAuthenticated

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('order')
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get('project', None)
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        return queryset

class TaskCommentViewSet(viewsets.ModelViewSet):
    queryset = TaskComment.objects.all().order_by('-created_at')
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        task_id = self.request.data.get('task')
        serializer.save(author=self.request.user, task_id=task_id)
