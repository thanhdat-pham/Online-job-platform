from django.utils import timezone
from django.template.response import TemplateResponse
from django.db.models import Count
from django.db.models.functions import TruncMonth, TruncQuarter, TruncYear
from django.contrib import admin
from apps.models.candidates import Application
from apps.models.jobs import Job, JobCategory
from apps.models.user import User

def dashboard_view(request):
    current_year = timezone.now().year
    year = int(request.GET.get('year', current_year))
    period = request.GET.get('period', 'month')
    category_id = request.GET.get('category', '')
    all_years = list(range(current_year - 3, current_year + 1))
    categories = JobCategory.objects.all()

    jobs_qs = Job.objects.filter(created_at__year=year)
    apps_qs = Application.objects.filter(applied_at__year=year)
    if category_id:
        jobs_qs = jobs_qs.filter(category_id=category_id)
        apps_qs = apps_qs.filter(job__category_id=category_id)

    if period == 'quarter':
        trunc_fn = TruncQuarter
        def fmt(d): return f"Q{((d.month - 1) // 3) + 1}/{d.year}"
    elif period == 'year':
        trunc_fn = TruncYear
        def fmt(d): return str(d.year)
        jobs_qs = Job.objects.all()
        apps_qs = Application.objects.all()
        if category_id:
            jobs_qs = jobs_qs.filter(category_id=category_id)
            apps_qs = apps_qs.filter(job__category_id=category_id)
    else:
        trunc_fn = TruncMonth
        def fmt(d): return f"T{d.month}"

    def by_period(qs, date_field):
        data = qs.annotate(p=trunc_fn(date_field)).values('p').annotate(c=Count('pk')).order_by('p')
        if period == 'month':
            result = [0] * 12
            for row in data:
                if row['p']: result[row['p'].month - 1] = row['c']
            labels = [f"T{i + 1}" for i in range(12)]
        elif period == 'quarter':
            result_map = {}
            for row in data:
                if row['p']: result_map[fmt(row['p'])] = row['c']
            labels = [f"Q{i + 1}/{year}" for i in range(4)]
            result = [result_map.get(l, 0) for l in labels]
        else:
            result_map = {}
            for row in data:
                if row['p']: result_map[fmt(row['p'])] = row['c']
            labels = [str(y) for y in range(current_year - 3, current_year + 1)]
            result = [result_map.get(l, 0) for l in labels]
        return labels, result

    app_labels, app_data = by_period(apps_qs, 'applied_at')
    job_labels, job_data = by_period(jobs_qs, 'created_at')

    cand_qs = User.objects.filter(role='CANDIDATE', created_date__year=year)
    emp_qs = User.objects.filter(role='EMPLOYER', created_date__year=year)
    if period == 'year':
        cand_qs = User.objects.filter(role='CANDIDATE')
        emp_qs = User.objects.filter(role='EMPLOYER')
    _, cand_data = by_period(cand_qs, 'created_date')
    _, emp_data = by_period(emp_qs, 'created_date')

    all_apps = Application.objects.all()
    if category_id:
        all_apps = all_apps.filter(job__category_id=category_id)

    sc = dict(all_apps.values_list('status').annotate(c=Count('pk')))

    context = {
        **admin.site.each_context(request),
        'year': year, 'period': period, 'category_id': category_id,
        'all_years': all_years, 'categories': categories,
        'total_jobs': Job.objects.count(),
        'total_candidates': User.objects.filter(role='CANDIDATE').count(),
        'total_employers': User.objects.filter(role='EMPLOYER').count(),
        'total_applications': Application.objects.count(),
        'app_labels': app_labels, 'app_data': app_data,
        'job_labels': job_labels, 'job_data': job_data,
        'cand_data': cand_data, 'emp_data': emp_data,
        'status_data': [sc.get('pending', 0), sc.get('reviewed', 0), sc.get('interviewing', 0), sc.get('accepted', 0),
                        sc.get('rejected', 0)],
    }
    return TemplateResponse(request, 'admin/dashboard.html', context)