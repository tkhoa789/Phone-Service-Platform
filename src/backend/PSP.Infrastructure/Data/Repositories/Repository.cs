using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PSP.Application.Common.Interfaces;
using PSP.Domain.Common.Entities;

namespace PSP.Infrastructure.Data.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<T?> GetByIdAsNoTrackingAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<T>> GetAllAsNoTrackingAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Where(predicate).ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<T>> FindAsNoTrackingAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AsNoTracking().Where(predicate).ToListAsync(cancellationToken);
    }

    public IQueryable<T> GetQueryable()
    {
        return _dbSet.AsQueryable();
    }

    public IQueryable<T> GetQueryableAsNoTracking()
    {
        return _dbSet.AsNoTracking();
    }

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddAsync(entity, cancellationToken);
    }

    public void Update(T entity)
    {
        _dbSet.Update(entity);
    }

    public void Remove(T entity)
    {
        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        _dbSet.Update(entity);
    }

    public void HardRemove(T entity)
    {
        _dbSet.Remove(entity);
    }

    public async Task<T?> FindFirstIgnoreQueryFiltersAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.IgnoreQueryFilters().FirstOrDefaultAsync(predicate, cancellationToken);
    }
}
