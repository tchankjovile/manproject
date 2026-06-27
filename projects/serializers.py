from rest_framework import serializers
from .models import Project, Task, TaskComment
from accounts.serializers import UserSerializer

class ProjectSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    
    class Meta:
        model = Project
        fields = '__all__'

class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskComment
        fields = '__all__'
        read_only_fields = ('task',)

class TaskSerializer(serializers.ModelSerializer):
    comments = TaskCommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
