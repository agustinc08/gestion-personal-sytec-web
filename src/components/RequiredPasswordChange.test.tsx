import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RequiredPasswordChange from './RequiredPasswordChange';

describe('required password change gate', () => {
  it('shows only the password gate and awaits the password update', async () => {
    const user = userEvent.setup();
    let resolveChange!: () => void;
    const onChange = vi.fn(() => new Promise<void>((resolve) => { resolveChange = resolve; }));
    render(<RequiredPasswordChange onChange={onChange} onLogout={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Actualizá tu contraseña' })).toBeTruthy();
    expect(screen.queryByText('Panel de administración')).toBeNull();
    await user.type(screen.getByLabelText('Contraseña actual'), 'temporary');
    await user.type(screen.getByLabelText('Nueva contraseña'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(onChange).toHaveBeenCalledWith('temporary', 'secure-password');
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeTruthy();
    resolveChange();
  });
});
