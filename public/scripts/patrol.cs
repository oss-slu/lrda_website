using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class enemyPatrol : MonoBehaviour
{
	public GameObject pointA;
	public GameObject pointB;
	private Rigidbody2D rb;
	//private Animator anim;
	private Transform currentPoint;
	public float speed;
	// Start is called before the first frame update

	void Start()
	{
		rb = GetComponent<Rigidbody2D>();
		rb.gravityScale = 0;
		currentPoint = pointB.transform;
		//anim = GetComponent<Animator>();
		//anim.SetBool("isRunning", true);
	}

	//Update is called once per frame
    	void Update()
    	{
        	Vector2 direction = (currentPoint.position - transform.position).normalized;
        	rb.velocity = new Vector2(direction.x * speed, direction.y * speed); 

        	if (Vector2.Distance(transform.position, currentPoint.position) < 1f)
        	{
            		if (currentPoint == pointB.transform)
            		{
                		currentPoint = pointA.transform;
            		}
            		else if (currentPoint == pointA.transform)
            		{
                		currentPoint = pointB.transform;
            		}
        	}
    	}
}