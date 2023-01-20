from django import template
register = template.Library()

@register.simple_tag
def contains_obj(container, field, obj, success, failure):
    if not container:
        return failure
    if obj in getattr(container,field).all():
        return success
    else:
        return failure

@register.filter
def order_by(queryset, args):
    args = [x.strip() for x in args.split(',')]
    return queryset.order_by(*args)