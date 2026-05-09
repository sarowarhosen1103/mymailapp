import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ContactGroup from '@/models/ContactGroup';
import Contact from '@/models/Contact';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const group = await ContactGroup.findById(id).populate('contacts');
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    
    return NextResponse.json(group);
  } catch (error) {
    console.error('Failed to fetch group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const updatedGroup = await ContactGroup.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Failed to update group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectToDatabase();

    const deletedGroup = await ContactGroup.findByIdAndDelete(id);

    if (!deletedGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Failed to delete group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}

// PATCH: Add contacts to group without replacing existing ones
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { contactIds } = await req.json();

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'contactIds must be a non-empty array' }, { status: 400 });
    }

    await connectToDatabase();

    const updatedGroup = await ContactGroup.findByIdAndUpdate(
      id,
      { $addToSet: { contacts: { $each: contactIds } } },
      { new: true }
    );

    if (!updatedGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ message: `Added ${contactIds.length} contact(s) to group`, group: updatedGroup });
  } catch (error) {
    console.error('Failed to add contacts to group:', error);
    return NextResponse.json({ error: 'Failed to add contacts to group' }, { status: 500 });
  }
}
