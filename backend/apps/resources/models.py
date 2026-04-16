from django.conf import settings
from django.db import models
from django.utils.text import slugify

from apps.common.models import TimeStampedModel


class Category(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ("name",)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Resource(TimeStampedModel):
    FORMAT_ARTICLE = "article"
    FORMAT_VIDEO = "video"
    FORMAT_AUDIO = "audio"
    FORMAT_GUIDE = "guide"
    FORMAT_CHOICES = (
        (FORMAT_ARTICLE, "Article"),
        (FORMAT_VIDEO, "Video"),
        (FORMAT_AUDIO, "Audio"),
        (FORMAT_GUIDE, "Guide"),
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="resources")
    summary = models.TextField(blank=True)
    content = models.TextField()
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default=FORMAT_ARTICLE)
    published = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_resources")

    class Meta:
        ordering = ("title",)
        indexes = [
            models.Index(fields=["published"]),
            models.Index(fields=["format"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
