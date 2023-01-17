from django import template
register = template.Library()

@register.simple_tag
def contains_id(container, field, id):
    print(container, field, id)
    try:
        val = getattr(container, field).contains(id)
        return val
    except Exception as e:
        print(e)
        return ""
